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
  msg: jest.fn(),
  open: jest.fn(() => 1),
  prompt: jest.fn(),
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

  const groups = document.querySelectorAll(".card-body");
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

test("shows each example once and separates advanced demos", () => {
  loadPlayground();
  const ids = Array.from(
    document.querySelectorAll("[data-demo]"),
    (button) => button.dataset.demo
  );
  expect(new Set(ids).size).toBe(ids.length);
  ["message-hi", "message-sauce", "prompt-chain"].forEach((id) => {
    expect(ids).not.toContain(id);
  });
  expect(
    Array.from(
      document.querySelectorAll("[data-advanced-demos] [data-demo]"),
      (button) => button.dataset.demo
    )
  ).toEqual(["stacked-layers", "countdown-alert"]);
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

test.each([
  ["text", 0],
  ["password", 1],
  ["textarea", 2],
])("the %s prompt closes without opening another layer", (name, formType) => {
  loadPlayground();
  document.querySelector(`[data-demo="prompt-${name}"]`).click();
  expect(mockLayerApi.prompt).toHaveBeenCalledTimes(1);
  expect(mockLayerApi.prompt.mock.calls[0][0].formType).toBe(formType);
  mockLayerApi.prompt.mock.calls[0][1]("<strong>Input</strong>", 7);
  expect(mockLayerApi.close).toHaveBeenCalledWith(7);
  expect(mockLayerApi.prompt).toHaveBeenCalledTimes(1);
  expect(mockLayerApi.alert).not.toHaveBeenCalled();
  expect(mockLayerApi.msg).not.toHaveBeenCalled();
});

test("confirmation closes its own dialog without follow-up messages", () => {
  loadPlayground();
  document.querySelector('[data-demo="confirm-basic"]').click();
  mockLayerApi.confirm.mock.calls[0][2](9);
  expect(mockLayerApi.close).toHaveBeenCalledWith(9);
  expect(mockLayerApi.msg).not.toHaveBeenCalled();
});

test.each([
  "loading-0",
  "loading-1",
  "loading-2",
  "window-controls",
  "iframe-full",
  "capture-page",
  "close-loading",
  "close-all",
])("%s has no delayed or follow-up popup", (id) => {
  loadPlayground();
  document.querySelector(`[data-demo="${id}"]`).click();
  expect(jest.getTimerCount()).toBe(0);
  jest.runOnlyPendingTimers();
  expect(mockLayerApi.msg).not.toHaveBeenCalled();
  expect(mockLayerApi.alert).not.toHaveBeenCalled();
  if (id.startsWith("loading-")) {
    expect(mockLayerApi.load.mock.calls[0][1].time).toBe(1.6);
  } else if (id === "window-controls") {
    expect(mockLayerApi.open.mock.calls[0][0].maxmin).toBe(true);
  } else if (id === "capture-page") {
    const options = mockLayerApi.open.mock.calls[0][0];
    expect(options.cancel).toBeUndefined();
    expect(options.content.classList.contains("d-none")).toBe(false);
  } else if (id.startsWith("close-")) {
    expect(mockLayerApi.closeAll.mock.calls[0]).toEqual(
      id === "close-loading" ? ["loading"] : []
    );
  }
});

test.each([
  "confirm-basic",
  "message-buttons",
  "capture-page",
  "loading-0",
  "loading-1",
  "loading-2",
  "prompt-text",
  "prompt-password",
  "prompt-textarea",
  "window-controls",
  "close-loading",
  "close-all",
])("%s displays code matching its action", (id) => {
  loadPlayground();
  jest.clearAllMocks();
  const button = document.querySelector(`[data-demo="${id}"]`);
  button.click();
  const source = button
    .closest(".card-body")
    .querySelector("[data-demo-source-code]").textContent;
  const names = Object.keys(mockLayerApi);
  const snippetApi = names.map(() => jest.fn());
  // Execute only the repository-owned example, with isolated API mocks.
  new Function(...names, "captureSource", source)(
    ...snippetApi,
    document.querySelector("#capture-source")
  );
  names.forEach((name, index) => {
    const expectedCalls = mockLayerApi[name].mock.calls.map((args) =>
      args.map((arg) =>
        typeof arg === "function" ? expect.any(Function) : arg
      )
    );
    expect(snippetApi[index].mock.calls).toEqual(expectedCalls);
  });
  if (id === "confirm-basic" || id.startsWith("prompt-")) {
    const apiName = id === "confirm-basic" ? "confirm" : "prompt";
    const callbackIndex = apiName === "confirm" ? 2 : 1;
    const args = apiName === "confirm" ? [7] : ["Input", 7];
    snippetApi[names.indexOf(apiName)].mock.calls[0][callbackIndex](...args);
    mockLayerApi[apiName].mock.calls[0][callbackIndex](...args);
    expect(snippetApi[names.indexOf("close")].mock.calls).toEqual([[7]]);
    expect(mockLayerApi.close.mock.calls).toEqual([[7]]);
    expect(snippetApi[names.indexOf("msg")]).not.toHaveBeenCalled();
    expect(snippetApi[names.indexOf("alert")]).not.toHaveBeenCalled();
  }
});

test("captured content has a modal shade and can be reopened after closing", () => {
  loadPlayground();
  const runtime = jest.requireActual("../src/index.ts");
  const button = document.querySelector('[data-demo="capture-page"]');
  const content = document.querySelector("#capture-source");
  const parent = content.parentElement;
  button.click();
  const options = mockLayerApi.open.mock.calls[0][0];
  try {
    const index = runtime.open(options);
    expect(
      document.querySelector(`.layer-esm-shade[data-index="${index}"]`)
    ).not.toBeNull();
    expect(
      document
        .querySelector(`.layer-esm[data-index="${index}"]`)
        .contains(content)
    ).toBe(true);
    runtime.close(index);
    jest.advanceTimersByTime(200);
    expect(content.parentElement).toBe(parent);
    expect(() => runtime.open(options)).not.toThrow();
  } finally {
    runtime.destroy();
  }
});
