/** @jest-environment jsdom */

const { initializeNavigation } = require("../site/navigation");
const { initializeThemeControls } = require("../site/theme");
const projectConfig = require("../project.config.cjs");

const { colorDark, colorLight, storageKey } = projectConfig.site.theme;

afterEach(() => {
  jest.restoreAllMocks();
  localStorage.clear();
  history.replaceState({}, "", "/");
  document.documentElement.removeAttribute("data-theme-controls-ready");
});

test("theme selection follows the system and persists an explicit choice", () => {
  document.documentElement.removeAttribute("data-theme-controls-ready");
  document.head.innerHTML = `
    <meta name="theme-color" content="${colorLight}" data-theme-color
      data-theme-color-light="${colorLight}" data-theme-color-dark="${colorDark}">
  `;
  document.body.innerHTML = `
    <label>Theme
      <select data-theme-select>
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  `;
  const mediaListeners = [];
  const removeEventListener = jest.fn();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      matches: true,
      addEventListener: (_name, listener) => mediaListeners.push(listener),
      removeEventListener,
    }),
  });
  localStorage.clear();
  localStorage.setItem(storageKey, "system");
  const cleanup = initializeThemeControls(storageKey);
  const select = document.querySelector("[data-theme-select]");

  expect(document.documentElement.dataset.bsTheme).toBe("dark");
  expect(document.querySelector('meta[name="theme-color"]').content).toBe(
    colorDark
  );
  expect(select.value).toBe("system");
  select.value = "light";
  select.dispatchEvent(new Event("change", { bubbles: true }));
  expect(document.documentElement.dataset.bsTheme).toBe("light");
  expect(document.querySelector('meta[name="theme-color"]').content).toBe(
    colorLight
  );
  expect(localStorage.getItem(storageKey)).toBe("light");
  expect(localStorage.getItem("tsd-theme")).toBe("light");
  expect(mediaListeners).toHaveLength(1);
  cleanup();
  expect(removeEventListener).toHaveBeenCalledWith("change", mediaListeners[0]);
});

test("initial theme follows URL, storage, system, and fallback precedence", () => {
  document.head.innerHTML = `
    <meta name="theme-color" content="${colorLight}" data-theme-color
      data-theme-color-light="${colorLight}" data-theme-color-dark="${colorDark}">
  `;
  document.body.innerHTML = `
    <select data-theme-select>
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  `;
  history.replaceState({}, "", "/?theme=dark");
  localStorage.setItem(storageKey, "light");
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
  });

  const cleanup = initializeThemeControls(storageKey);

  expect(document.documentElement.dataset.bsTheme).toBe("dark");
  expect(document.querySelector("[data-theme-select]").value).toBe("dark");
  expect(localStorage.getItem(storageKey)).toBe("dark");
  cleanup();
});

test("an in-page system selection overrides an initial URL theme", () => {
  document.body.innerHTML = `
    <select data-theme-select>
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  `;
  history.replaceState({}, "", "/?theme=dark");
  let dark = false;
  let listener;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      get matches() {
        return dark;
      },
      addEventListener: (_name, callback) => {
        listener = callback;
      },
      removeEventListener: jest.fn(),
    }),
  });
  const cleanup = initializeThemeControls(storageKey);
  const select = document.querySelector("[data-theme-select]");

  expect(document.documentElement.dataset.bsTheme).toBe("dark");
  select.value = "system";
  select.dispatchEvent(new Event("change", { bubbles: true }));
  expect(document.documentElement.dataset.bsTheme).toBe("light");
  expect(localStorage.getItem(storageKey)).toBe("system");

  dark = true;
  listener({ matches: true });
  expect(document.documentElement.dataset.bsTheme).toBe("dark");
  expect(localStorage.getItem(storageKey)).toBe("system");
  cleanup();
});

test("a rejected preference write still applies system mode for the session", () => {
  document.head.innerHTML = `
    <meta name="theme-color" content="${colorLight}" data-theme-color
      data-theme-color-light="${colorLight}" data-theme-color-dark="${colorDark}">
  `;
  document.body.innerHTML = `
    <select data-theme-select>
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  `;
  let dark = false;
  let listener;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      get matches() {
        return dark;
      },
      addEventListener: (_name, callback) => {
        listener = callback;
      },
      removeEventListener: jest.fn(),
    }),
  });
  localStorage.setItem(storageKey, "dark");
  const originalSetItem = Storage.prototype.setItem;
  jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(function (key, value) {
      if (key === storageKey) {
        throw new DOMException("Storage write rejected", "SecurityError");
      }
      return originalSetItem.call(this, key, value);
    });
  const cleanup = initializeThemeControls(storageKey);
  const select = document.querySelector("[data-theme-select]");

  select.value = "system";
  expect(() =>
    select.dispatchEvent(new Event("change", { bubbles: true }))
  ).not.toThrow();
  expect(document.documentElement.dataset.bsTheme).toBe("light");
  expect(select.value).toBe("system");
  expect(localStorage.getItem(storageKey)).toBe("dark");

  dark = true;
  listener({ matches: true });
  expect(document.documentElement.dataset.bsTheme).toBe("dark");
  expect(select.value).toBe("system");
  cleanup();
});

test("unsupported control values do not replace the current preference", () => {
  document.body.innerHTML = `
    <select data-theme-select>
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="unsupported">Unsupported</option>
    </select>
  `;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
  });
  const cleanup = initializeThemeControls(storageKey);
  const select = document.querySelector("[data-theme-select]");

  select.value = "unsupported";
  expect(() =>
    select.dispatchEvent(new Event("change", { bubbles: true }))
  ).not.toThrow();
  expect(select.value).toBe("system");
  expect(localStorage.getItem(storageKey)).toBeNull();
  cleanup();
});

test("Bootstrap navigation closes on Escape and restores toggle focus", () => {
  document.documentElement.removeAttribute("data-nav-enhanced");
  document.body.innerHTML = `
    <nav data-site-navbar>
      <button type="button" aria-expanded="false" data-nav-toggle>Menu</button>
      <div id="navigation" data-mobile-nav><a href="#target">Target</a></div>
    </nav>
  `;
  const navigation = document.querySelector("[data-mobile-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const instance = {
    toggle: jest.fn(() => {
      navigation.dispatchEvent(new Event("show.bs.collapse"));
      navigation.classList.add("show");
    }),
    hide: jest.fn(() => {
      navigation.dispatchEvent(new Event("hide.bs.collapse"));
      navigation.classList.remove("show");
      navigation.dispatchEvent(new Event("hidden.bs.collapse"));
    }),
  };
  const Collapse = {
    getOrCreateInstance: jest.fn(() => instance),
  };

  initializeNavigation(Collapse);
  initializeNavigation(Collapse);
  toggle.click();
  expect(instance.toggle).toHaveBeenCalledTimes(1);
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  expect(instance.hide).toHaveBeenCalledTimes(1);
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(toggle);
  expect(Collapse.getOrCreateInstance).toHaveBeenCalledTimes(1);
});
