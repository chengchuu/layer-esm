/** @jest-environment jsdom */
/* eslint-disable no-undef */

const loadLayer = () => {
  jest.resetModules();
  return require("../src/index.ts");
};

const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  document.documentElement.innerHTML = "<head></head><body></body>";
  history.replaceState({}, "", "/");
  localStorage.clear();
  if (originalMatchMedia) window.matchMedia = originalMatchMedia;
  else delete window.matchMedia;
  jest.useRealTimers();
});

test("creates one lazy React host and reuses it", () => {
  const runtime = loadLayer();
  expect(document.querySelector("[data-layer-esm-host]")).toBeNull();

  runtime.msg("First", { time: 0 });
  runtime.alert("Second");

  expect(document.querySelectorAll("[data-layer-esm-host]")).toHaveLength(1);
  expect(document.querySelectorAll(".layer-esm")).toHaveLength(2);
});

test("uses independent shared hosts for different Document targets", () => {
  const runtime = loadLayer();
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  const frameDocument = iframe.contentDocument;
  expect(frameDocument).not.toBeNull();

  runtime.msg("Main", { time: 0 });
  runtime.msg("Frame", { time: 0, targetDocument: frameDocument });

  expect(document.querySelectorAll("[data-layer-esm-host]")).toHaveLength(1);
  expect(frameDocument.querySelectorAll("[data-layer-esm-host]")).toHaveLength(
    1
  );
  expect(frameDocument.querySelector(".layer-esm").textContent).toContain(
    "Frame"
  );

  runtime.destroy(frameDocument);
  expect(frameDocument.querySelector("[data-layer-esm-host]")).toBeNull();
  expect(document.querySelector("[data-layer-esm-host]")).not.toBeNull();
});

test("minimized stacks are independent across Document targets", () => {
  const runtime = loadLayer();
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  const frameDocument = iframe.contentDocument;
  const mainIndex = runtime.open({ type: 1, content: "Main" });
  const frameIndex = runtime.open({
    type: 1,
    content: "Frame",
    targetDocument: frameDocument,
  });

  runtime.min(mainIndex);
  runtime.min(frameIndex);

  expect(document.querySelector(`[data-index="${mainIndex}"]`).style.left).toBe(
    "0px"
  );
  expect(
    frameDocument.querySelector(`[data-index="${frameIndex}"]`).style.left
  ).toBe("0px");
});

test("cross-document HTMLElement content is restored after close", () => {
  const runtime = loadLayer();
  const iframe = document.createElement("iframe");
  const parent = document.createElement("div");
  const content = document.createElement("button");
  parent.appendChild(content);
  document.body.append(parent, iframe);
  const frameDocument = iframe.contentDocument;

  const index = runtime.open({
    type: 1,
    content,
    targetDocument: frameDocument,
    isOutAnim: false,
  });

  expect(content.ownerDocument).toBe(frameDocument);
  expect(
    frameDocument
      .querySelector(`.layer-esm[data-index="${index}"]`)
      .contains(content)
  ).toBe(true);

  runtime.close(index);
  expect(content.ownerDocument).toBe(document);
  expect(content.parentNode).toBe(parent);
});

test("focus restoration is scoped to each Document host", () => {
  const runtime = loadLayer();
  const trigger = document.createElement("button");
  const outside = document.createElement("button");
  const iframe = document.createElement("iframe");
  document.body.append(trigger, outside, iframe);
  trigger.focus();
  const mainIndex = runtime.open({
    content: "Main",
    btn: "OK",
    isOutAnim: false,
  });
  runtime.open({
    content: "Frame",
    btn: "OK",
    targetDocument: iframe.contentDocument,
  });

  outside.focus();
  runtime.close(mainIndex);

  expect(document.activeElement).toBe(trigger);
});

test("destroy closes records, restores moved content, and unmounts the host", () => {
  const runtime = loadLayer();
  const parent = document.createElement("div");
  const content = document.createElement("button");
  parent.appendChild(content);
  document.body.appendChild(parent);
  runtime.open({ type: 1, content, isOutAnim: false });

  runtime.destroy();

  expect(content.parentNode).toBe(parent);
  expect(document.querySelector("[data-layer-esm-host]")).toBeNull();
  expect(document.querySelector(".layer-esm")).toBeNull();
  expect(document.querySelector("style[data-styled]")).toBeNull();
});

test("a layer opened by an end callback survives host destruction without stale state", () => {
  const runtime = loadLayer();
  let reopenedIndex;
  const firstIndex = runtime.open({
    content: "First",
    end: () => {
      reopenedIndex = runtime.msg("Reopened", { time: 0, isOutAnim: false });
    },
  });

  runtime.destroy();

  expect(document.querySelector(`[data-index="${firstIndex}"]`)).toBeNull();
  expect(
    document.querySelector(`[data-index="${reopenedIndex}"]`)
  ).not.toBeNull();
  expect(document.querySelectorAll("[data-layer-esm-host]")).toHaveLength(1);
  expect(document.querySelectorAll("style[data-styled]")).toHaveLength(1);
  expect(
    getComputedStyle(
      document.querySelector(`.layer-esm[data-index="${reopenedIndex}"]`)
    ).backgroundColor
  ).toBe("rgb(45, 55, 72)");
  runtime.close(reopenedIndex);
  expect(document.querySelector(`[data-index="${reopenedIndex}"]`)).toBeNull();
});

test("destroy removes the host and styles even when an end callback throws", () => {
  const runtime = loadLayer();
  runtime.open({
    content: "Throwing callback",
    end: () => {
      throw new Error("end failed");
    },
  });

  expect(() => runtime.destroy()).toThrow("end failed");
  expect(document.querySelector("[data-layer-esm-host]")).toBeNull();
  expect(document.querySelector(".layer-esm")).toBeNull();
  expect(document.querySelector("style[data-styled]")).toBeNull();
});

test("dark and custom themes update active layers", () => {
  const runtime = loadLayer();
  const index = runtime.open({ content: "Theme" });
  const root = document.querySelector(`.layer-esm[data-index="${index}"]`);

  runtime.config({ theme: "dark" });
  expect(getComputedStyle(root).backgroundColor).toBe("rgb(23, 32, 51)");

  runtime.config({ theme: { background: "rgb(1, 2, 3)", radius: "3px" } });
  expect(getComputedStyle(root).backgroundColor).toBe("rgb(1, 2, 3)");
  expect(getComputedStyle(root).borderRadius).toBe("3px");
});

test("uses the Mazey theme preference when no theme is configured", () => {
  localStorage.setItem("layer-esm-theme", "dark");
  const runtime = loadLayer();
  const index = runtime.open({ content: "Preferred theme" });
  const root = document.querySelector(`.layer-esm[data-index="${index}"]`);

  expect(getComputedStyle(root).backgroundColor).toBe("rgb(23, 32, 51)");
});

test("uses and persists the Mazey query theme when no theme is configured", () => {
  history.replaceState({}, "", "/?theme=dark");
  const runtime = loadLayer();
  const index = runtime.open({ content: "Query theme" });
  const root = document.querySelector(`.layer-esm[data-index="${index}"]`);

  expect(localStorage.getItem("layer-esm-theme")).toBe("dark");
  expect(getComputedStyle(root).backgroundColor).toBe("rgb(23, 32, 51)");
});

test("uses the system theme when no stored or configured theme exists", () => {
  window.matchMedia = jest.fn(() => ({ matches: true }));
  const runtime = loadLayer();
  const index = runtime.open({ content: "System preference" });
  const root = document.querySelector(`.layer-esm[data-index="${index}"]`);

  expect(window.matchMedia).toHaveBeenCalledWith(
    "(prefers-color-scheme: dark)"
  );
  expect(getComputedStyle(root).backgroundColor).toBe("rgb(23, 32, 51)");
});

test("explicit theme configuration overrides the Mazey preference", () => {
  localStorage.setItem("layer-esm-theme", "dark");
  const runtime = loadLayer();
  runtime.config({ theme: "light" });
  const index = runtime.open({ content: "Configured theme" });
  const root = document.querySelector(`.layer-esm[data-index="${index}"]`);

  expect(getComputedStyle(root).backgroundColor).toBe("rgb(255, 255, 255)");
});

test("explicit theme configuration does not resolve or persist a query fallback", () => {
  history.replaceState({}, "", "/?theme=dark");
  const runtime = loadLayer();
  runtime.config({ theme: "light" });
  const index = runtime.open({ content: "Configured query theme" });
  const root = document.querySelector(`.layer-esm[data-index="${index}"]`);

  expect(localStorage.getItem("layer-esm-theme")).toBeNull();
  expect(getComputedStyle(root).backgroundColor).toBe("rgb(255, 255, 255)");
});

test("shares one resolved default across document hosts", () => {
  localStorage.setItem("layer-esm-theme", "light");
  const runtime = loadLayer();
  const mainIndex = runtime.open({ content: "Main theme" });
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);

  localStorage.setItem("layer-esm-theme", "dark");
  const frameIndex = runtime.open({
    content: "Frame theme",
    targetDocument: iframe.contentDocument,
  });

  expect(
    getComputedStyle(
      document.querySelector(`.layer-esm[data-index="${mainIndex}"]`)
    ).backgroundColor
  ).toBe("rgb(255, 255, 255)");
  expect(
    iframe.contentWindow.getComputedStyle(
      iframe.contentDocument.querySelector(
        `.layer-esm[data-index="${frameIndex}"]`
      )
    ).backgroundColor
  ).toBe("rgb(255, 255, 255)");
});

test("captures the default theme once for unrelated config updates", () => {
  localStorage.setItem("layer-esm-theme", "light");
  const runtime = loadLayer();
  const index = runtime.open({ content: "Initial theme" });
  const root = document.querySelector(`.layer-esm[data-index="${index}"]`);

  localStorage.setItem("layer-esm-theme", "dark");
  runtime.config({ styleNonce: "test-nonce" });

  expect(getComputedStyle(root).backgroundColor).toBe("rgb(255, 255, 255)");
});

test("changing themes does not reset focus inside an active layer", () => {
  const runtime = loadLayer();
  const index = runtime.prompt({ title: "Keep focus" });
  const input = document.querySelector(`[data-index="${index}"] input`);
  input.focus();

  runtime.config({ theme: "dark" });

  expect(document.activeElement).toBe(input);
});

test("custom themes supply default shade and tooltip colors", () => {
  const runtime = loadLayer();
  const target = document.createElement("button");
  document.body.appendChild(target);
  runtime.config({
    theme: {
      shade: "rgb(4, 5, 6)",
      tooltipBackground: "rgb(1, 2, 3)",
    },
  });

  runtime.open({ content: "Dialog" });
  runtime.tips("Hint", target, { time: 0 });

  expect(
    getComputedStyle(document.querySelector(".layer-esm-shade")).backgroundColor
  ).toBe("rgb(4, 5, 6)");
  expect(
    getComputedStyle(document.querySelector(".layer-esm__tips")).backgroundColor
  ).toBe("rgb(1, 2, 3)");
});

test("system theme follows runtime media-query changes", () => {
  let dark = false;
  let listener;
  window.matchMedia = jest.fn(() => ({
    get matches() {
      return dark;
    },
    addEventListener: (_type, callback) => {
      listener = callback;
    },
    removeEventListener: jest.fn(),
  }));
  const runtime = loadLayer();
  runtime.config({ theme: "system" });
  const index = runtime.open({ content: "System" });
  const root = document.querySelector(`.layer-esm[data-index="${index}"]`);
  expect(getComputedStyle(root).backgroundColor).toBe("rgb(255, 255, 255)");

  dark = true;
  listener({ matches: true });
  expect(getComputedStyle(root).backgroundColor).toBe("rgb(23, 32, 51)");
});

test("system theme supports legacy MediaQueryList listeners", () => {
  let dark = false;
  let listener;
  const removeListener = jest.fn();
  window.matchMedia = jest.fn(() => ({
    get matches() {
      return dark;
    },
    addListener: (callback) => {
      listener = callback;
    },
    removeListener,
  }));
  const runtime = loadLayer();
  runtime.config({ theme: "system" });
  const index = runtime.open({ content: "Legacy system" });
  const root = document.querySelector(`.layer-esm[data-index="${index}"]`);
  expect(getComputedStyle(root).backgroundColor).toBe("rgb(255, 255, 255)");

  dark = true;
  listener({ matches: true });
  expect(getComputedStyle(root).backgroundColor).toBe("rgb(23, 32, 51)");

  runtime.destroy();
  expect(removeListener).toHaveBeenCalledWith(listener);
});

test("prompt is labelled and tabs support arrow-key navigation", () => {
  const runtime = loadLayer();
  const promptIndex = runtime.prompt({ title: "Account name" });
  const input = document.querySelector(`[data-index="${promptIndex}"] input`);
  expect(input.getAttribute("aria-label")).toBe("Account name");

  const change = jest.fn();
  const tabIndex = runtime.tab({
    tab: [
      { title: "First", content: "One" },
      { title: "Second", content: "Two" },
    ],
    change,
  });
  const tabs = document.querySelectorAll(
    `[data-index="${tabIndex}"] [role="tab"]`
  );
  tabs[0].focus();
  tabs[0].dispatchEvent(
    new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })
  );
  expect(tabs[1].getAttribute("aria-selected")).toBe("true");
  expect(document.activeElement).toBe(tabs[1]);
  expect(change).toHaveBeenCalledWith(1);
});
