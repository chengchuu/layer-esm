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
  expect(code.textContent).toBe('alert("Great to See You", { icon: 1 });');
  copyButton.click();
  await flushClipboard();
  expect(writeText).toHaveBeenLastCalledWith(code.textContent);
  jest.advanceTimersByTime(2000);
  expect(copyButton.textContent).toBe("Copy code");
  expect(status.textContent).toBe("");
});

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
