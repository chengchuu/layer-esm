/**
 * @jest-environment jsdom
 */
/* eslint-disable no-undef */

const mockLayerApi = {
  alert: jest.fn(),
  close: jest.fn(),
  closeAll: jest.fn(),
  config: jest.fn(),
  confirm: jest.fn(),
  full: jest.fn(),
  load: jest.fn(() => 1),
  min: jest.fn(),
  msg: jest.fn(),
  open: jest.fn(() => 1),
  prompt: jest.fn(),
  restore: jest.fn(),
  tab: jest.fn(),
  tips: jest.fn(),
  title: jest.fn(),
};

jest.mock("../src", () => mockLayerApi);

const { siteThemeChangeEvent } = require("../site/theme-events");

const loadPlayground = () => {
  jest.resetModules();
  require("../examples/index.ts");
};

const flushClipboard = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const installClipboard = (writeText) => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: writeText ? { writeText } : undefined,
  });
};

beforeEach(() => {
  document.documentElement.innerHTML =
    '<head></head><body><div id="demo-gallery"></div></body>';
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  delete navigator.clipboard;
});

test("every generated code panel has an accessible copy control", () => {
  installClipboard(jest.fn().mockResolvedValue(undefined));
  loadPlayground();

  const groups = document.querySelectorAll(
    ".playground-demo-controls, .card-body"
  );
  const panels = document.querySelectorAll("[data-demo-source-panel]");
  expect(panels).toHaveLength(groups.length);

  panels.forEach((panel) => {
    const button = panel.querySelector("[data-demo-source-copy]");
    const status = panel.querySelector("[data-demo-source-copy-status]");
    expect(button.tagName).toBe("BUTTON");
    expect(button.type).toBe("button");
    expect(button.textContent).toBe("Copy code");
    expect(button.classList.contains("btn-outline-secondary")).toBe(true);
    expect(button.classList.contains("btn-outline-light")).toBe(false);
    expect(status.classList.contains("visually-hidden")).toBe(true);
    expect(status.getAttribute("role")).toBe("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
  });
});

test("copies current source and restarts feedback timing", async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  installClipboard(writeText);
  loadPlayground();

  const demoButton = document.querySelector('[data-demo="alert-icon"]');
  const panel = demoButton
    .closest(".card-body")
    .querySelector("[data-demo-source-panel]");
  const copyButton = panel.querySelector("[data-demo-source-copy]");
  const status = panel.querySelector("[data-demo-source-copy-status]");
  const code = panel.querySelector("[data-demo-source-code]");

  copyButton.click();
  await flushClipboard();
  expect(writeText).toHaveBeenLastCalledWith(code.textContent);
  expect(copyButton.textContent).toBe("Copied");
  expect(status.textContent).toBe("Code copied to the clipboard.");

  jest.advanceTimersByTime(1000);
  copyButton.click();
  await flushClipboard();
  jest.advanceTimersByTime(1001);
  expect(copyButton.textContent).toBe("Copied");

  demoButton.click();
  expect(copyButton.textContent).toBe("Copy code");
  expect(status.textContent).toBe("");
  expect(code.textContent).toBe(
    'alert("Great to See You", { icon: "success" });'
  );
  copyButton.click();
  await flushClipboard();
  expect(writeText).toHaveBeenLastCalledWith(code.textContent);
  jest.advanceTimersByTime(2000);
  expect(copyButton.textContent).toBe("Copy code");
  expect(status.textContent).toBe("");
});

test("named icon demos execute the same code shown in their panels", () => {
  loadPlayground();

  const alertButton = document.querySelector('[data-demo="alert-icon"]');
  alertButton.click();
  expect(mockLayerApi.alert).toHaveBeenLastCalledWith("Great to See You", {
    icon: "success",
  });
  expect(
    alertButton.closest(".card-body").querySelector("[data-demo-source-code]")
      .textContent
  ).toBe('alert("Great to See You", { icon: "success" });');

  const loadingButton = document.querySelector('[data-demo="loading-msg"]');
  loadingButton.click();
  expect(mockLayerApi.load).toHaveBeenLastCalledWith("success", {
    content: "Saved",
    shade: 0.01,
    time: 2,
  });
  expect(
    loadingButton.closest(".card-body").querySelector("[data-demo-source-code]")
      .textContent
  ).toContain('load("success", {');
});

test("keeps the layer theme synchronized with the resolved page theme", () => {
  document.documentElement.dataset.bsTheme = "light";
  loadPlayground();

  expect(mockLayerApi.config).toHaveBeenLastCalledWith({ theme: "light" });

  document.documentElement.dataset.bsTheme = "dark";
  document.documentElement.dispatchEvent(
    new CustomEvent(siteThemeChangeEvent, {
      detail: { theme: "dark" },
    })
  );
  expect(mockLayerApi.config).toHaveBeenLastCalledWith({ theme: "dark" });

  document.documentElement.dataset.bsTheme = "light";
  document.documentElement.dispatchEvent(
    new CustomEvent(siteThemeChangeEvent, {
      detail: { theme: "light" },
    })
  );
  expect(mockLayerApi.config).toHaveBeenLastCalledWith({ theme: "light" });
});

test("places the compact single-icons card after message variants", () => {
  loadPlayground();

  const titles = Array.from(
    document.querySelectorAll(".playground-demo-grid .card-title"),
    (title) => title.textContent
  );
  expect(titles.slice(0, 4)).toEqual([
    "Alert & Confirm",
    "Message Variants",
    "Single Icons",
    "Captured Page Layer",
  ]);

  const controls = document.querySelector(
    '[data-demo="icon-warning"]'
  ).parentElement;
  expect(controls.classList.contains("d-flex")).toBe(true);
  expect(controls.classList.contains("flex-wrap")).toBe(true);
});

test.each([
  ["warning", "Warning"],
  ["success", "Success"],
  ["error", "Error"],
  ["question", "Question"],
  ["lock", "Lock"],
  ["sad", "Sad"],
  ["smile", "Smile"],
])(
  "runs the %s single-icon example and displays matching source",
  (icon, label) => {
    loadPlayground();

    const button = document.querySelector(`[data-demo="icon-${icon}"]`);
    expect(button).not.toBeNull();
    button.click();

    expect(mockLayerApi.msg).toHaveBeenLastCalledWith(label, { icon });
    expect(
      button.closest(".card-body").querySelector("[data-demo-source-code]")
        .textContent
    ).toBe(`msg("${label}", { icon: "${icon}" });`);
  }
);

test.each([
  ["is unavailable", null],
  ["rejects the write", jest.fn().mockRejectedValue(new Error("Denied"))],
])("announces when the Clipboard API %s", async (_description, writeText) => {
  installClipboard(writeText);
  loadPlayground();

  const panel = document.querySelector("[data-demo-source-panel]");
  const copyButton = panel.querySelector("[data-demo-source-copy]");
  const status = panel.querySelector("[data-demo-source-copy-status]");
  copyButton.click();
  await flushClipboard();

  expect(copyButton.textContent).toBe("Copy unavailable");
  expect(status.textContent).toBe(
    "Copy unavailable. Select the code manually."
  );
  jest.advanceTimersByTime(2000);
  expect(copyButton.textContent).toBe("Copy code");
  expect(status.textContent).toBe("");
});
