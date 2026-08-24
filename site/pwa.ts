import {
  isSafePWAEnv,
  isStandalonePWA,
  listenMediaQueryChanges,
  watchServiceWorkerUpdates,
} from "mazey";

export interface SitePwaConfig {
  appName: string;
  enabled: boolean;
  scope: string;
  serviceWorkerUrl: string;
}

interface InstallChoice {
  outcome: "accepted" | "dismissed";
  platform?: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<InstallChoice>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

interface WindowWithIdleCallback {
  requestIdleCallback?: (callback: () => void) => number;
}

function setHidden(elements: Element[], hidden: boolean): void {
  elements.forEach((element) => {
    if (element instanceof HTMLElement) element.hidden = hidden;
  });
}

function statusAnnouncer(documentRef: Document): (message: string) => void {
  const regions = Array.from(
    documentRef.querySelectorAll<HTMLElement>("[data-pwa-status]")
  );
  return (message) =>
    regions.forEach((region) => (region.textContent = message));
}

export function shouldRegisterSiteServiceWorker(
  config: SitePwaConfig,
  documentRef: Document,
  windowRef: Window,
  navigatorRef: Navigator
): boolean {
  return (
    config.enabled &&
    isSafePWAEnv({
      scope: config.scope,
      environment: {
        window: windowRef,
        navigator: navigatorRef,
        document: documentRef,
      },
    })
  );
}

export function initializeInstallExperience(
  documentRef: Document,
  windowRef: Window,
  navigatorRef: NavigatorWithStandalone,
  appName: string
): () => void {
  const installButtons = Array.from(
    documentRef.querySelectorAll<HTMLButtonElement>("[data-pwa-install]")
  );
  const installHelp = Array.from(
    documentRef.querySelectorAll<HTMLElement>("[data-pwa-install-help]")
  );
  const announce = statusAnnouncer(documentRef);
  const displayMode = windowRef.matchMedia("(display-mode: standalone)");
  const standaloneOptions = {
    environment: {
      window: windowRef,
      navigator: navigatorRef,
      document: documentRef,
    },
  };
  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  const setInstallButtonsHidden = (hidden: boolean) => {
    installButtons.forEach((button) => {
      button.hidden = hidden;
      const container = button.closest<HTMLElement>(
        "[data-pwa-install-container]"
      );
      if (container) container.hidden = hidden;
    });
  };

  const showInstalledState = () => {
    deferredPrompt = null;
    setInstallButtonsHidden(true);
    setHidden(installHelp, true);
  };

  const handlePromptAvailable = (event: Event) => {
    if (isStandalonePWA(standaloneOptions)) return;
    const promptEvent = event as BeforeInstallPromptEvent;
    promptEvent.preventDefault();
    deferredPrompt = promptEvent;
    installButtons.forEach((button) => {
      button.disabled = false;
    });
    setInstallButtonsHidden(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    const promptEvent = deferredPrompt;
    deferredPrompt = null;
    installButtons.forEach((button) => (button.disabled = true));

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") {
        announce("The app installation was accepted.");
      } else {
        announce(
          "Installation was dismissed. You can still use your browser's install menu later."
        );
      }
    } catch {
      announce(
        "The browser could not open its installation prompt. Use the browser's install menu instead."
      );
    } finally {
      setInstallButtonsHidden(true);
    }
  };

  const handleInstalled = () => {
    showInstalledState();
    announce(`${appName} was installed.`);
  };
  const handleDisplayMode = () => {
    if (isStandalonePWA(standaloneOptions)) showInstalledState();
  };

  if (installButtons.length === 0) {
    if (isStandalonePWA(standaloneOptions)) showInstalledState();
    windowRef.addEventListener("appinstalled", handleInstalled);
    const removeDisplayModeListener = listenMediaQueryChanges(
      displayMode,
      handleDisplayMode
    );
    return () => {
      windowRef.removeEventListener("appinstalled", handleInstalled);
      removeDisplayModeListener();
    };
  }

  if (isStandalonePWA(standaloneOptions)) showInstalledState();
  installButtons.forEach((button) =>
    button.addEventListener("click", handleInstall)
  );
  windowRef.addEventListener("beforeinstallprompt", handlePromptAvailable);
  windowRef.addEventListener("appinstalled", handleInstalled);
  const removeDisplayModeListener = listenMediaQueryChanges(
    displayMode,
    handleDisplayMode
  );

  return () => {
    installButtons.forEach((button) =>
      button.removeEventListener("click", handleInstall)
    );
    windowRef.removeEventListener("beforeinstallprompt", handlePromptAvailable);
    windowRef.removeEventListener("appinstalled", handleInstalled);
    removeDisplayModeListener();
  };
}

export function monitorServiceWorkerUpdates(
  registration: ServiceWorkerRegistration,
  documentRef: Document,
  navigatorRef: Navigator,
  windowRef: Window,
  appName: string
): () => void {
  const notice = documentRef.querySelector<HTMLElement>("[data-pwa-update]");
  const updateButton = documentRef.querySelector<HTMLButtonElement>(
    "[data-pwa-update-now]"
  );
  const announce = statusAnnouncer(documentRef);
  let reloadRequested = false;

  const watcher = watchServiceWorkerUpdates(
    registration,
    navigatorRef.serviceWorker,
    {
      onUpdateAvailable() {
        if (notice) notice.hidden = false;
        announce(`A new version of the ${appName} website is available.`);
      },
      onControllerChange() {
        if (notice) notice.hidden = true;
        if (!reloadRequested) return;
        reloadRequested = false;
        windowRef.location.reload();
      },
    }
  );
  const handleUpdate = () => {
    if (!watcher.activateWaiting()) return;
    reloadRequested = true;
    if (updateButton) updateButton.disabled = true;
    announce("Updating the website now.");
  };

  updateButton?.addEventListener("click", handleUpdate);

  return () => {
    updateButton?.removeEventListener("click", handleUpdate);
    watcher.dispose();
  };
}

export async function registerSiteServiceWorker(
  config: SitePwaConfig,
  documentRef: Document,
  windowRef: Window,
  navigatorRef: Navigator
): Promise<ServiceWorkerRegistration | null> {
  if (
    !shouldRegisterSiteServiceWorker(
      config,
      documentRef,
      windowRef,
      navigatorRef
    )
  ) {
    return null;
  }

  try {
    const registration = await navigatorRef.serviceWorker.register(
      config.serviceWorkerUrl,
      { scope: config.scope }
    );
    monitorServiceWorkerUpdates(
      registration,
      documentRef,
      navigatorRef,
      windowRef,
      config.appName
    );
    return registration;
  } catch (error) {
    console.error(
      `Failed to register the ${config.appName} service worker.`,
      error
    );
    return null;
  }
}

export function initializeSitePwa(config: SitePwaConfig): void {
  if (
    typeof document === "undefined" ||
    typeof window === "undefined" ||
    typeof navigator === "undefined"
  ) {
    return;
  }
  const root = document.documentElement;
  if (root.dataset.pwaReady === "true") return;
  root.dataset.pwaReady = "true";

  initializeInstallExperience(document, window, navigator, config.appName);
  if (!shouldRegisterSiteServiceWorker(config, document, window, navigator))
    return;

  const scheduleRegistration = () => {
    const idleWindow = window as unknown as WindowWithIdleCallback;
    if (idleWindow.requestIdleCallback) {
      idleWindow.requestIdleCallback(() => {
        void registerSiteServiceWorker(config, document, window, navigator);
      });
    } else {
      window.setTimeout(() => {
        void registerSiteServiceWorker(config, document, window, navigator);
      }, 0);
    }
  };

  if (document.readyState === "complete") scheduleRegistration();
  else window.addEventListener("load", scheduleRegistration, { once: true });
}
