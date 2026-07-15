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

test("load injects styles once and renders CSS spinner", () => {
  const { load, close } = loadLayer();

  const first = load(1, { content: "Loading" });
  const second = load(2, { content: "Still loading" });

  expect(document.querySelectorAll("style#layer-esm-style")).toHaveLength(1);
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

test("style injection supports CSP nonces and a preloaded-style mode", () => {
  let runtime = loadLayer();
  runtime.config({ styleNonce: "test-nonce" });
  expect(document.querySelector("#layer-esm-style").nonce).toBe("test-nonce");

  document.documentElement.innerHTML = "<head></head><body></body>";
  runtime = loadLayer();
  runtime.config({ injectStyles: false });
  runtime.open({ content: "Externally styled" });
  expect(document.querySelector("#layer-esm-style")).toBeNull();
  expect(runtime.layerStyles).toContain(".layer-esm");
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
  minButton.click();
  expect(root.style.bottom).toBe("");
  maxButton.click();
  expect(root.style.width).toBe("100vw");
  maxButton.click();
  expect(root.style.width).not.toBe("100vw");
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
