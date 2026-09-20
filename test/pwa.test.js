/** @jest-environment jsdom */

const {
  initializeInstallExperience,
  registerSiteServiceWorker,
  shouldRegisterSiteServiceWorker,
} = require("../site/pwa");
const projectConfig = require("../project.config.cjs");

const appName = projectConfig.brand.displayName;
const pwaConfig = {
  appName,
  enabled: true,
  scope: projectConfig.site.basePath,
  serviceWorkerUrl: projectConfig.pwa.serviceWorkerUrl,
};

function installMatchMedia(matches = false) {
  const media = new EventTarget();
  Object.assign(media, { matches, media: "(display-mode: standalone)" });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: jest.fn(() => media),
  });
  return media;
}

function renderInstallControls() {
  document.body.innerHTML = `
    <span data-pwa-install-container hidden>
      <button type="button" data-pwa-install hidden>Install app</button>
    </span>
    <section data-pwa-install-help>Website app help</section>
    <p role="status" aria-live="polite" data-pwa-status></p>
  `;
}

function installPrompt(outcome) {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  event.prompt = jest.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome });
  return event;
}

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

test.each([
  ["accepted", "The app installation was accepted."],
  [
    "dismissed",
    "Installation was dismissed. You can still use your browser's install menu later.",
  ],
])(
  "install prompt is captured and reports a %s choice",
  async (outcome, message) => {
    renderInstallControls();
    installMatchMedia(false);
    const cleanup = initializeInstallExperience(
      document,
      window,
      navigator,
      appName
    );
    const event = installPrompt(outcome);

    window.dispatchEvent(event);
    const button = document.querySelector("[data-pwa-install]");
    expect(event.defaultPrevented).toBe(true);
    expect(button.hidden).toBe(false);
    expect(document.querySelector("[data-pwa-install-container]").hidden).toBe(
      false
    );
    expect(event.prompt).not.toHaveBeenCalled();

    button.click();
    await settle();
    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(button.hidden).toBe(true);
    expect(document.querySelector("[data-pwa-install-container]").hidden).toBe(
      true
    );
    expect(document.querySelector("[data-pwa-status]").textContent).toBe(
      message
    );
    cleanup();
  }
);

test("fallback help remains when no custom install event is available", () => {
  renderInstallControls();
  installMatchMedia(false);
  const cleanup = initializeInstallExperience(
    document,
    window,
    navigator,
    appName
  );
  expect(document.querySelector("[data-pwa-install]").hidden).toBe(true);
  expect(document.querySelector("[data-pwa-install-help]").hidden).toBe(false);
  cleanup();
});

test("pages without install buttons leave the browser install prompt available", () => {
  document.body.innerHTML = `
    <section data-pwa-install-help>Website app help</section>
    <p role="status" aria-live="polite" data-pwa-status></p>
  `;
  installMatchMedia(false);
  const cleanup = initializeInstallExperience(
    document,
    window,
    navigator,
    appName
  );
  const event = installPrompt("accepted");

  window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(false);
  expect(event.prompt).not.toHaveBeenCalled();
  cleanup();
});

test("standalone mode and appinstalled hide installation controls", () => {
  renderInstallControls();
  installMatchMedia(true);
  const cleanup = initializeInstallExperience(
    document,
    window,
    navigator,
    appName
  );
  expect(document.querySelector("[data-pwa-install-help]").hidden).toBe(true);
  cleanup();

  renderInstallControls();
  installMatchMedia(false);
  const secondCleanup = initializeInstallExperience(
    document,
    window,
    navigator,
    appName
  );
  window.dispatchEvent(new Event("appinstalled"));
  expect(document.querySelector("[data-pwa-install-help]").hidden).toBe(true);
  expect(document.querySelector("[data-pwa-status]").textContent).toBe(
    `${appName} was installed.`
  );
  secondCleanup();
});

test("service-worker registration delegates environment and scope checks", async () => {
  const registration = Object.assign(new EventTarget(), {
    installing: null,
    waiting: null,
  });
  const registrationListener = jest.spyOn(registration, "addEventListener");
  const serviceWorker = Object.assign(new EventTarget(), {
    controller: null,
    register: jest.fn().mockResolvedValue(registration),
  });
  const serviceWorkerListener = jest.spyOn(serviceWorker, "addEventListener");
  const navigatorRef = { serviceWorker };
  const config = pwaConfig;
  const siteUrl = new URL(projectConfig.site.url);
  const windowRef = {
    isSecureContext: true,
    location: new URL(projectConfig.site.basePath, siteUrl),
    matchMedia: jest.fn().mockReturnValue({ matches: false }),
  };
  const documentRef = document.implementation.createHTMLDocument("Layer PWA");
  const manifest = documentRef.createElement("link");
  manifest.rel = "manifest";
  manifest.href = "/manifest.webmanifest";
  documentRef.head.appendChild(manifest);

  expect(
    shouldRegisterSiteServiceWorker(
      { ...config, enabled: false },
      documentRef,
      windowRef,
      navigatorRef
    )
  ).toBe(false);
  expect(
    shouldRegisterSiteServiceWorker(
      config,
      documentRef,
      windowRef,
      navigatorRef
    )
  ).toBe(true);
  expect(
    shouldRegisterSiteServiceWorker(
      config,
      documentRef,
      { ...windowRef, isSecureContext: false },
      navigatorRef
    )
  ).toBe(false);
  expect(
    shouldRegisterSiteServiceWorker(config, documentRef, windowRef, {})
  ).toBe(false);
  expect(
    shouldRegisterSiteServiceWorker(
      config,
      document.implementation.createHTMLDocument("No manifest"),
      windowRef,
      navigatorRef
    )
  ).toBe(false);
  expect(
    shouldRegisterSiteServiceWorker(
      config,
      documentRef,
      {
        ...windowRef,
        location: new URL("/another-project/", siteUrl),
      },
      navigatorRef
    )
  ).toBe(false);

  await registerSiteServiceWorker(config, documentRef, windowRef, navigatorRef);
  expect(serviceWorker.register).toHaveBeenCalledWith(
    projectConfig.pwa.serviceWorkerUrl,
    { scope: projectConfig.site.basePath }
  );
  expect(registrationListener).not.toHaveBeenCalled();
  expect(serviceWorkerListener).not.toHaveBeenCalled();
});
