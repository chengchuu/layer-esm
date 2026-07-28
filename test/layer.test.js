/**
 * @jest-environment jsdom
 */
/* eslint-disable no-undef */

const loadLayer = () => {
  jest.resetModules();
  return require("../src/index.ts");
};

const queryLayer = (index) =>
  document.querySelector(`.layer-esm[data-index="${index}"]`);

beforeEach(() => {
  document.documentElement.innerHTML = "<head></head><body></body>";
  jest.useRealTimers();
});

test("open renders a dialog and close removes it", () => {
  jest.useFakeTimers();
  const { open, close } = loadLayer();

  const index = open({
    content: "<strong>Hello</strong>",
    title: "Greeting",
    btn: ["OK"],
  });

  const layer = queryLayer(index);
  expect(layer).not.toBeNull();
  expect(layer.textContent).toContain("Greeting");
  expect(layer.textContent).toContain("Hello");

  close(index);
  jest.advanceTimersByTime(250);
  expect(queryLayer(index)).toBeNull();
});

test("open uses an English default title", () => {
  const { open, close } = loadLayer();

  const index = open({
    content: "Default title",
  });

  expect(queryLayer(index).textContent).toContain("Information");

  close(index);
});

test("title controls header and close button rendering", () => {
  const { confirm } = loadLayer();
  const emptyTitleIndex = confirm("Empty title", {
    title: "",
    closeBtn: 1,
  });
  const titlelessIndex = confirm("No title", {
    title: false,
    closeBtn: 1,
  });
  const emptyTitleLayer = queryLayer(emptyTitleIndex);
  const titlelessLayer = queryLayer(titlelessIndex);

  expect(emptyTitleLayer.querySelector(".layer-esm__title")).not.toBeNull();
  expect(
    emptyTitleLayer.querySelector(".layer-esm__toolbar-button--close")
  ).not.toBeNull();
  expect(titlelessLayer.querySelector(".layer-esm__title")).toBeNull();
  expect(
    titlelessLayer.querySelector(".layer-esm__toolbar-button--close")
  ).toBeNull();
  expect(titlelessLayer.getAttribute("aria-label")).toBe("Dialog");
});

test("titleless buttonless open layers use non-modal status semantics", () => {
  const { open } = loadLayer();
  const index = open({ title: false, btn: false, content: "Updated" });
  const root = queryLayer(index);

  expect(root.getAttribute("role")).toBe("status");
  expect(root.getAttribute("aria-live")).toBe("polite");
  expect(root.getAttribute("aria-modal")).toBeNull();
});

test("shade dismissal calls cancel and honors a false result", () => {
  const { open } = loadLayer();
  const cancel = jest.fn().mockReturnValueOnce(false);
  const index = open({
    content: "Dismiss",
    shadeClose: true,
    cancel,
    isOutAnim: false,
  });
  const shade = document.querySelector(
    `.layer-esm-shade[data-index="${index}"]`
  );

  shade.click();
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(queryLayer(index)).not.toBeNull();

  shade.click();
  expect(cancel).toHaveBeenCalledTimes(2);
  expect(queryLayer(index)).toBeNull();
});

test("confirm triggers callbacks for both buttons", () => {
  const { confirm } = loadLayer();
  const yes = jest.fn();
  const no = jest.fn();

  const index = confirm("Continue?", {}, yes, no);
  const buttons = document.querySelectorAll(
    `.layer-esm[data-index="${index}"] .layer-esm__button`
  );

  buttons[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(yes).toHaveBeenCalledTimes(1);

  buttons[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(no).toHaveBeenCalledTimes(1);
});

test("msg auto closes after its timeout", () => {
  jest.useFakeTimers();
  const { msg } = loadLayer();

  const index = msg("Saved");
  expect(queryLayer(index)).not.toBeNull();

  jest.advanceTimersByTime(3200);
  expect(queryLayer(index)).toBeNull();
});

test("msg bottom offset does not stretch from the default center position", () => {
  const { applyOffset } = require("../src/utils/position.ts");
  // This jsdom version drops valid "auto" length values from CSSStyleDeclaration.
  const style = {};
  applyOffset({ style }, "b", true);

  expect(style.top).toBe("auto");
  expect(style.bottom).toBe("0");

  const { msg } = loadLayer();
  const index = msg("Saved", { offset: "b", time: 0 });
  const root = queryLayer(index);

  expect(root.style.bottom).toBe("0px");
  expect(root.style.left).toBe("calc(50% + 0px)");
  expect(root.style.transform).toBe("translateX(-50%)");
});

test("top messages keep their placement transform during entrance animation", () => {
  const { msg } = loadLayer();
  const index = msg("Hi, Welcome to the layer-esm Example Page", {
    offset: "t",
    anim: 6,
    time: 0,
  });
  const root = queryLayer(index);
  const styleText = Array.from(document.querySelectorAll("style[data-styled]"))
    .map((styleElement) => styleElement.textContent)
    .join("\n");

  expect(root.style.top).toBe("0px");
  expect(root.style.left).toBe("calc(50% + 0px)");
  expect(root.style.transform).toBe("translateX(-50%)");
  expect(styleText).toContain("translate:-6px 0");
  expect(styleText).not.toContain("transform:translate(-50%,-50%)");
});

test("msg keeps icon, button, and callback customizations on its lightweight path", () => {
  const { msg } = loadLayer();
  const yes = jest.fn();
  const index = msg("Choose", {
    icon: 5,
    time: 0,
    btn: ["Confirm", "Close"],
    yes,
  });
  const root = queryLayer(index);

  expect(root.querySelector(".layer-esm__icon--5")).not.toBeNull();
  expect(root.getAttribute("role")).toBe("dialog");
  expect(root.querySelectorAll(".layer-esm__button")).toHaveLength(2);
  root.querySelector(".layer-esm__button").click();
  expect(yes).toHaveBeenCalledWith(index, root);
});

test("status messages do not block the active dialog keyboard handler", () => {
  const { msg, open } = loadLayer();
  const index = open({ content: "Dialog", isOutAnim: false });
  msg("Background status", { time: 0 });

  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
  );
  expect(queryLayer(index)).toBeNull();
});

test("msg rolls back scroll and DOM state when its success callback throws", () => {
  const { msg } = loadLayer();
  document.documentElement.style.overflow = "clip";

  expect(() =>
    msg("Failure", {
      scrollbar: false,
      success: () => {
        throw new Error("success failed");
      },
    })
  ).toThrow("success failed");
  expect(document.documentElement.style.overflow).toBe("clip");
  expect(document.querySelector(".layer-esm")).toBeNull();
});

test("a timed message closed by success does not leave a stale timer", () => {
  jest.useFakeTimers();
  const { close, msg } = loadLayer();
  const end = jest.fn();

  const index = msg("Close during success", {
    isOutAnim: false,
    end,
    success: (_layer, currentIndex) => close(currentIndex),
  });

  expect(queryLayer(index)).toBeNull();
  expect(end).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(5000);
  expect(end).toHaveBeenCalledTimes(1);
});

test("dialog icons render distinct legacy-compatible glyphs", () => {
  const { open, close } = loadLayer();
  const expectedIcons = ["!", "✓", "×", "?", "", "☹", "☺"];

  expectedIcons.forEach((expectedIcon, icon) => {
    const index = open({
      content: `Icon ${icon}`,
      icon,
    });
    const iconNode = document.querySelector(
      `.layer-esm[data-index="${index}"] .layer-esm__icon--${icon}`
    );

    expect(iconNode).not.toBeNull();
    expect(iconNode.dataset.icon).toBe(expectedIcon);

    close(index);
  });
});

test("message icons use compact dimensions without shrinking dialog icons", () => {
  const { msg, open } = loadLayer();
  const messageIndex = msg("Common Notice", { icon: 5, time: 0 });
  const dialogIndex = open({ content: "Dialog Notice", icon: 5 });
  const messageIcon = queryLayer(messageIndex).querySelector(
    ".layer-esm__icon--5"
  );
  const dialogIcon = queryLayer(dialogIndex).querySelector(
    ".layer-esm__icon--5"
  );
  const messageRow = messageIcon.parentElement;

  expect(getComputedStyle(messageIcon).width).toBe("26px");
  expect(getComputedStyle(messageIcon).height).toBe("26px");
  expect(getComputedStyle(messageIcon).fontSize).toBe("16px");
  expect(getComputedStyle(messageRow).alignItems).toBe("center");
  expect(getComputedStyle(dialogIcon).width).toBe("34px");
  expect(getComputedStyle(dialogIcon).height).toBe("34px");
});

test("numeric animation options select distinct entrance animations", () => {
  const { open } = loadLayer();
  const scale = queryLayer(open({ content: "Scale", anim: 0 }));
  const fade = queryLayer(open({ content: "Fade", anim: 5 }));
  const styleText = Array.from(document.querySelectorAll("style[data-styled]"))
    .map((styleElement) => styleElement.textContent)
    .join("\n");
  const animationClass = (element) =>
    Array.from(element.classList).find((className) =>
      new RegExp(`\\.${className}\\{[^}]*animation:`).test(styleText)
    );

  expect(animationClass(scale)).toBeTruthy();
  expect(animationClass(fade)).toBeTruthy();
  expect(animationClass(scale)).not.toBe(animationClass(fade));
});

test("load uses one styled-components sheet and renders CSS spinner", () => {
  const { load, close } = loadLayer();

  const first = load(1, { content: "Loading" });
  const second = load(2, { content: "Still loading" });

  expect(document.querySelectorAll("style[data-styled]")).toHaveLength(1);
  expect(
    document.querySelector(
      `.layer-esm[data-index="${first}"] .layer-esm__spinner--1`
    )
  ).not.toBeNull();
  expect(
    document.querySelector(
      `.layer-esm[data-index="${second}"] .layer-esm__spinner--2`
    )
  ).not.toBeNull();

  close(first);
  close(second);
});

test("style injection supports CSP nonces and rejects the obsolete preloaded-style mode", () => {
  const runtime = loadLayer();
  runtime.config({ styleNonce: "test-nonce" });
  runtime.open({ content: "Nonce styles" });
  expect(document.querySelector("style[data-styled]").nonce).toBe("test-nonce");
  expect(() => runtime.config({ injectStyles: false })).toThrow(
    /incompatible with styled-components/
  );
  expect(runtime.layerStyles).toContain("styled-components");
});

test("prompt supports a custom maxlength message", () => {
  const { prompt } = loadLayer();
  const yes = jest.fn();

  const index = prompt(
    {
      maxlength: 3,
      maxlengthMessage: (maxlength, value) =>
        `Please keep this within ${maxlength} chars. Current: ${value.length}.`,
    },
    yes
  );
  const layer = queryLayer(index);
  const input = layer.querySelector(".layui-layer-input");
  const okButton = layer.querySelector(".layer-esm__button");

  input.value = "abcd";
  okButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));

  expect(yes).not.toHaveBeenCalled();
  expect(document.body.textContent).toContain(
    "Please keep this within 3 chars. Current: 4."
  );
});

test("prompt controls fill the available dialog content width", () => {
  const { prompt } = loadLayer();
  const index = prompt({ title: "Full-width input" });
  const root = queryLayer(index);
  const input = root.querySelector("input");
  const field = input.parentElement;

  expect(getComputedStyle(field).display).toBe("block");
  expect(getComputedStyle(field).width).toBe("100%");
  expect(getComputedStyle(input).width).toBe("100%");
});

test("prompt renders a custom maxlength message as text", () => {
  const { prompt } = loadLayer();
  const index = prompt({
    maxlength: 1,
    maxlengthMessage: (_maxlength, value) => `Too long: ${value}`,
  });
  const layer = queryLayer(index);
  const input = layer.querySelector(".layui-layer-input");

  input.value = '<img data-proof="raw">';
  layer.querySelector(".layer-esm__button").click();

  const tip = document.querySelector(".layer-esm__tips");
  expect(tip.querySelector("img")).toBeNull();
  expect(tip.textContent).toContain('<img data-proof="raw">');
});

test("close is idempotent while its exit animation is running", () => {
  jest.useFakeTimers();
  const { close, open } = loadLayer();
  const end = jest.fn();
  const firstCallback = jest.fn();
  const ignoredCallback = jest.fn();
  const index = open({ content: "Close once", end });

  close(index, firstCallback);
  close(index, ignoredCallback);
  jest.advanceTimersByTime(250);

  expect(end).toHaveBeenCalledTimes(1);
  expect(firstCallback).toHaveBeenCalledTimes(1);
  expect(ignoredCallback).not.toHaveBeenCalled();
});

test("close completes queued callbacks and focus cleanup when end throws", () => {
  const { close, open } = loadLayer();
  const trigger = document.createElement("button");
  document.body.appendChild(trigger);
  trigger.focus();
  const callback = jest.fn();
  const index = open({
    content: "Throwing callback",
    btn: "OK",
    isOutAnim: false,
    end: () => {
      throw new Error("end failed");
    },
  });

  expect(() => close(index, callback)).toThrow("end failed");
  expect(callback).toHaveBeenCalledTimes(1);
  expect(queryLayer(index)).toBeNull();
  expect(document.activeElement).toBe(trigger);
});

test("closeAll waits for records that are already closing", () => {
  jest.useFakeTimers();
  const { close, closeAll, open } = loadLayer();
  const done = jest.fn();
  const first = open({ content: "First" });
  open({ content: "Second" });

  close(first);
  closeAll(done);

  expect(done).not.toHaveBeenCalled();
  jest.advanceTimersByTime(250);
  expect(done).toHaveBeenCalledTimes(1);
  expect(document.querySelectorAll(".layer-esm")).toHaveLength(0);
});

test("scroll locking restores existing inline overflow after full and close", () => {
  const { close, full, open, restore } = loadLayer();
  document.documentElement.style.overflow = "clip";
  const index = open({ content: "Locked", scrollbar: false, isOutAnim: false });

  full(index);
  restore(index);
  close(index);

  expect(document.documentElement.style.overflow).toBe("clip");
});

test("moved content is safely restored and cannot be owned by two layers", () => {
  const { close, open } = loadLayer();
  const host = document.createElement("div");
  const content = document.createElement("button");
  host.appendChild(content);
  document.body.appendChild(host);
  const index = open({ type: 1, content, isOutAnim: false });

  expect(() => open({ type: 1, content, isOutAnim: false })).toThrow(
    /already mounted/
  );
  host.firstChild.remove();
  expect(() => close(index)).not.toThrow();
  expect(content.parentNode).toBe(host);
});

test("dialogs expose modal semantics, trap focus, close on Escape, and restore focus", () => {
  const { open } = loadLayer();
  const trigger = document.createElement("button");
  document.body.appendChild(trigger);
  trigger.focus();
  const index = open({
    content: "Accessible",
    btn: ["OK", "Cancel"],
    isOutAnim: false,
  });
  const root = queryLayer(index);
  const buttons = root.querySelectorAll("button");

  expect(root.getAttribute("role")).toBe("dialog");
  expect(root.getAttribute("aria-modal")).toBe("true");
  expect(root.getAttribute("aria-labelledby")).toBeTruthy();
  buttons[buttons.length - 1].focus();
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Tab", bubbles: true })
  );
  expect(document.activeElement).toBe(buttons[0]);
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
  );
  expect(queryLayer(index)).toBeNull();
  expect(document.activeElement).toBe(trigger);
});

test("toolbar minimize and maximize controls toggle their corresponding states", () => {
  const { open } = loadLayer();
  const index = open({
    type: 1,
    content: "Window",
    maxmin: true,
    isOutAnim: false,
  });
  const root = queryLayer(index);
  const minButton = root.querySelector(".layer-esm__toolbar-button--min");
  const maxButton = root.querySelector(".layer-esm__toolbar-button--max");

  minButton.click();
  expect(root.style.bottom).toBe("0px");
  expect(document.activeElement).toBe(root);
  expect(root.getAttribute("aria-modal")).toBeNull();
  minButton.click();
  expect(root.style.bottom).toBe("");
  maxButton.click();
  expect(root.style.width).toBe("100vw");
  expect(root.style.maxWidth).toBe("none");
  expect(root.style.maxHeight).toBe("none");
  maxButton.click();
  expect(root.style.width).not.toBe("100vw");
});

test("maximize and minimize restore the current inline geometry", () => {
  const { full, min, open, restore, style } = loadLayer();
  const index = open({ type: 1, content: "Window", isOutAnim: false });
  const root = queryLayer(index);
  style(index, { left: 35, top: 48, width: 520, height: 280 });

  full(index);
  restore(index);
  expect(root.style.left).toBe("35px");
  expect(root.style.top).toBe("48px");
  expect(root.style.width).toBe("520px");
  expect(root.style.height).toBe("280px");

  min(index);
  restore(index);
  expect(root.style.left).toBe("35px");
  expect(root.style.top).toBe("48px");
  expect(root.style.width).toBe("520px");
  expect(root.style.height).toBe("280px");
});

test("minStack false does not offset minimized layers", () => {
  const { min, open } = loadLayer();
  const first = open({ type: 1, content: "First", minStack: false });
  const second = open({ type: 1, content: "Second", minStack: false });

  min(first);
  min(second);

  expect(queryLayer(first).style.left).toBe("0px");
  expect(queryLayer(second).style.left).toBe("0px");
});

test("explicit area is not capped by the default maxWidth and zIndex is honored", () => {
  const { open } = loadLayer();
  const index = open({ area: [640, 240], zIndex: 50000000 });
  const root = queryLayer(index);

  expect(root.style.width).toBe("640px");
  expect(root.style.maxWidth).toBe("calc(100vw - 2rem)");
  expect(Number(root.style.zIndex)).toBeGreaterThanOrEqual(50000001);
});

test("selector-like move options and cross-origin iframe helpers fail safely", () => {
  const { getChildFrame, iframeAuto, open } = loadLayer();
  expect(() =>
    open({ move: "#missing", content: "No drag handle" })
  ).not.toThrow();
  const index = open({
    type: 2,
    content: "https://example.com",
    isOutAnim: false,
  });
  const iframe = queryLayer(index).querySelector("iframe");
  Object.defineProperty(iframe, "contentDocument", {
    configurable: true,
    get() {
      throw new DOMException("Blocked", "SecurityError");
    },
  });

  expect(getChildFrame("body", index)).toBeNull();
  expect(() => iframeAuto(index)).not.toThrow();
});

test("custom move selectors drag the layer", () => {
  const { open } = loadLayer();
  const content = document.createElement("div");
  const handle = document.createElement("button");
  handle.className = "drag-handle";
  content.appendChild(handle);
  const index = open({ type: 1, content, move: ".drag-handle" });
  const root = queryLayer(index);
  root.getBoundingClientRect = () => ({
    left: 20,
    top: 30,
    width: 300,
    height: 200,
    right: 320,
    bottom: 230,
    x: 20,
    y: 30,
    toJSON: () => ({}),
  });

  handle.dispatchEvent(
    new MouseEvent("mousedown", {
      button: 0,
      clientX: 25,
      clientY: 35,
      bubbles: true,
    })
  );
  document.dispatchEvent(
    new MouseEvent("mousemove", { clientX: 65, clientY: 85, bubbles: true })
  );

  expect(root.style.left).toBe("60px");
  expect(root.style.top).toBe("80px");
});

test("tooltip arrows follow viewport-aware direction changes", () => {
  const { tips } = loadLayer();
  const target = document.createElement("button");
  target.getBoundingClientRect = () => ({
    left: 990,
    top: 200,
    width: 20,
    height: 20,
    right: 1010,
    bottom: 220,
    x: 990,
    y: 200,
    toJSON: () => ({}),
  });
  document.body.appendChild(target);
  const originalRect = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function () {
    if (this.classList?.contains("layer-esm--tips")) {
      return {
        left: 0,
        top: 0,
        width: 120,
        height: 40,
        right: 120,
        bottom: 40,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    }
    return originalRect.call(this);
  };

  try {
    const index = tips("Hint", target, { tips: 2, time: 0 });
    expect(
      queryLayer(index).querySelector(".layer-esm__tip-arrow--4")
    ).not.toBeNull();
  } finally {
    HTMLElement.prototype.getBoundingClientRect = originalRect;
  }
});

test("iframes keep generated lookup identifiers and tuple scrolling behavior", () => {
  const { getFrameIndex, open } = loadLayer();
  const index = open({
    type: 2,
    content: ["https://example.com", "no"],
  });
  const iframe = queryLayer(index).querySelector("iframe");

  expect(iframe.id).toBe(`layui-layer-iframe${index}`);
  expect(iframe.name).toBe(`layui-layer-iframe${index}`);
  expect(iframe.getAttribute("scrolling")).toBe("no");
  expect(getFrameIndex(iframe.name)).toBe(index);
});

test("tab rejects an empty tab list instead of rendering invalid relationships", () => {
  const { tab } = loadLayer();
  expect(() => tab({ tab: [] })).toThrow(/at least one tab item/);
});

test("title updates are text-only and alert renders a default action", () => {
  const { alert, open, title } = loadLayer();
  const index = open({ title: "Before", content: "Body" });
  title("<img src=x onerror=alert(1)>", index);
  expect(
    queryLayer(index).querySelector(".layer-esm__title").innerHTML
  ).toContain("&lt;img");

  const alertIndex = alert("Notice");
  expect(
    queryLayer(alertIndex).querySelectorAll(".layer-esm__button")
  ).toHaveLength(1);
});

test("closing during a drag removes document gesture listeners", () => {
  const { close, open } = loadLayer();
  const index = open({ content: "Drag", isOutAnim: false });
  const root = queryLayer(index);
  const handle = root.querySelector(".layer-esm__title");
  handle.dispatchEvent(
    new MouseEvent("mousedown", {
      button: 0,
      clientX: 10,
      clientY: 10,
      bubbles: true,
    })
  );
  close(index);
  const left = root.style.left;
  document.dispatchEvent(
    new MouseEvent("mousemove", { clientX: 200, clientY: 200, bubbles: true })
  );
  expect(root.style.left).toBe(left);
});

test("resize handles are only visible while the handle is hovered", () => {
  const { open } = loadLayer();
  const index = open({ content: "Resizable", resize: true });
  const handle = queryLayer(index).querySelector(".layer-esm__resize");
  const styleText = Array.from(document.querySelectorAll("style[data-styled]"))
    .map((styleElement) => styleElement.textContent)
    .join("\n");

  expect(handle).not.toBeNull();

  const hoverClass = Array.from(handle.classList).find((className) =>
    styleText.includes(`.${className}:hover{opacity:1;}`)
  );

  expect(getComputedStyle(handle).opacity).toBe("0");
  expect(hoverClass).toBeTruthy();
  expect(styleText).not.toMatch(/:hover \.layer-esm__resize/);
});

test("resizing a centered layer keeps its top-left position anchored", () => {
  const { open } = loadLayer();
  const index = open({ content: "Resizable", resize: true });
  const root = queryLayer(index);
  const handle = root.querySelector(".layer-esm__resize");
  root.getBoundingClientRect = () => ({
    left: 100,
    top: 80,
    width: 300,
    height: 200,
    right: 400,
    bottom: 280,
    x: 100,
    y: 80,
    toJSON: () => ({}),
  });

  handle.dispatchEvent(
    new MouseEvent("mousedown", {
      button: 0,
      clientX: 400,
      clientY: 280,
      bubbles: true,
    })
  );

  expect(root.style.left).toBe("100px");
  expect(root.style.top).toBe("80px");
  expect(root.style.transform).toBe("");

  document.dispatchEvent(
    new MouseEvent("mousemove", {
      clientX: 420,
      clientY: 310,
      bubbles: true,
    })
  );

  expect(root.style.left).toBe("100px");
  expect(root.style.top).toBe("80px");
  expect(root.style.width).toBe("320px");
  expect(root.style.height).toBe("230px");
});
