const { JSDOM } = require("jsdom");

const bundlePath = require.resolve("../dist/index.cjs");
let activeDom;

function freshRuntime() {
  activeDom?.window.close();
  activeDom = new JSDOM(
    "<!doctype html><html><head></head><body></body></html>",
    {
      url: "https://example.test/",
    }
  );
  const { window } = activeDom;
  Object.assign(global, {
    window,
    document: window.document,
    HTMLElement: window.HTMLElement,
    HTMLInputElement: window.HTMLInputElement,
    HTMLTextAreaElement: window.HTMLTextAreaElement,
    Node: window.Node,
    DOMException: window.DOMException,
  });
  delete require.cache[bundlePath];
  return require(bundlePath);
}

function layerRoot(index) {
  return document.querySelector(`.layer-esm[data-index="${index}"]`);
}

async function run() {
  const results = {};

  {
    const { close, open } = freshRuntime();
    let endCalls = 0;
    let closeCallbacks = 0;
    const index = open({ content: "double close", end: () => endCalls++ });
    close(index, () => closeCallbacks++);
    close(index, () => closeCallbacks++);
    await new Promise((resolve) => setTimeout(resolve, 230));
    results.doubleClose = { endCalls, closeCallbacks };
  }

  {
    const { close, open } = freshRuntime();
    document.documentElement.style.overflow = "clip";
    const index = open({
      content: "scroll lock",
      scrollbar: false,
      isOutAnim: false,
    });
    close(index);
    results.preexistingOverflow = document.documentElement.style.overflow;
  }

  {
    const { close, full, open } = freshRuntime();
    const index = open({
      content: "fullscreen",
      scrollbar: false,
      isOutAnim: false,
    });
    full(index);
    close(index);
    results.overflowAfterFullscreenClose =
      document.documentElement.style.overflow;
  }

  {
    const { open } = freshRuntime();
    const index = open({ content: "wide", area: ["640px", "340px"] });
    const root = layerRoot(index);
    results.explicitArea = {
      width: root.style.width,
      maxWidth: root.style.maxWidth,
    };
  }

  {
    const { open } = freshRuntime();
    const index = open({ content: "z-index", zIndex: 50000000 });
    results.requestedZIndex = {
      requested: 50000000,
      actual: Number(layerRoot(index).style.zIndex),
    };
  }

  {
    const { alert } = freshRuntime();
    const index = alert("Alert body");
    results.alertDefaultButtons =
      layerRoot(index).querySelectorAll(".layer-esm__button").length;
  }

  {
    const { open } = freshRuntime();
    const index = open({ content: "window controls", maxmin: true });
    const root = layerRoot(index);
    const before = root.style.cssText;
    root.querySelector(".layer-esm__toolbar-button--min").click();
    const afterMinClick = root.style.cssText;
    root.querySelector(".layer-esm__toolbar-button--max").click();
    results.maxminToolbar = {
      minChangedLayout: before !== afterMinClick,
      maxChangedLayout: afterMinClick !== root.style.cssText,
    };
  }

  {
    const { full, open, restore } = freshRuntime();
    const index = open({ content: "restore fullscreen", area: "420px" });
    const root = layerRoot(index);
    full(index);
    restore(index);
    results.restoreAfterFull = {
      width: root.style.width,
      height: root.style.height,
    };
  }

  {
    const { min, open } = freshRuntime();
    const first = open({ content: "first" });
    const second = open({ content: "second" });
    min(first);
    min(second);
    results.minimizedPositions = [
      layerRoot(first).style.left,
      layerRoot(second).style.left,
    ];
  }

  {
    const { close, open } = freshRuntime();
    const index = open({ content: "drag", isOutAnim: false });
    const root = layerRoot(index);
    root.getBoundingClientRect = () => ({
      left: 10,
      top: 20,
      right: 310,
      bottom: 220,
      width: 300,
      height: 200,
      x: 10,
      y: 20,
      toJSON() {},
    });
    root.querySelector(".layer-esm__title").dispatchEvent(
      new window.MouseEvent("mousedown", {
        bubbles: true,
        button: 0,
        clientX: 30,
        clientY: 40,
      })
    );
    const beforeClose = root.style.left;
    close(index);
    document.dispatchEvent(
      new window.MouseEvent("mousemove", {
        bubbles: true,
        clientX: 130,
        clientY: 140,
      })
    );
    results.dragAfterClose = { beforeClose, afterClose: root.style.left };
    document.dispatchEvent(new window.MouseEvent("mouseup", { bubbles: true }));
  }

  {
    const { open } = freshRuntime();
    const handle = document.createElement("div");
    handle.id = "drag-handle";
    const content = document.createElement("div");
    content.appendChild(handle);
    try {
      open({ type: 1, content, move: "#drag-handle" });
      results.idDragSelector = "opened without throwing";
    } catch (error) {
      results.idDragSelector = `${error.name}: ${error.message}`;
    }
  }

  {
    const { getChildFrame, open } = freshRuntime();
    const index = open({ type: 2, content: ["https://cross-origin.example/"] });
    const iframe = layerRoot(index).querySelector("iframe");
    Object.defineProperty(iframe, "contentDocument", {
      configurable: true,
      get() {
        throw new DOMException("Blocked a frame with origin", "SecurityError");
      },
    });
    try {
      getChildFrame("body", index);
      results.crossOriginFrame = "returned without throwing";
    } catch (error) {
      results.crossOriginFrame = `${error.name}: ${error.message}`;
    }
  }

  {
    const { open } = freshRuntime();
    const index = open({ content: "accessible name", btn: ["OK"] });
    const root = layerRoot(index);
    results.dialogAccessibility = {
      role: root.getAttribute("role"),
      ariaModal: root.getAttribute("aria-modal"),
      ariaLabelledby: root.getAttribute("aria-labelledby"),
      activeElement: document.activeElement.tagName,
    };
  }

  {
    const { close, open } = freshRuntime();
    const host = document.createElement("div");
    const content = document.createElement("button");
    host.appendChild(content);
    document.body.appendChild(host);
    const index = open({ type: 1, content, isOutAnim: false });
    host.firstChild.remove();
    try {
      close(index);
      results.removedPlaceholder = "closed without throwing";
    } catch (error) {
      results.removedPlaceholder = {
        error: `${error.name}: ${error.message}`,
        layerStillMounted: Boolean(layerRoot(index)),
      };
    }
  }

  {
    const { close, open } = freshRuntime();
    const host = document.createElement("div");
    const content = document.createElement("button");
    host.appendChild(content);
    document.body.appendChild(host);
    const first = open({ type: 1, content, isOutAnim: false });
    let duplicateRejected = false;
    try {
      open({ type: 1, content, isOutAnim: false });
    } catch {
      duplicateRejected = true;
    }
    close(first);
    results.reusedElement = {
      duplicateRejected,
      connected: content.isConnected,
      restoredToOriginalParent: content.parentNode === host,
    };
  }

  {
    const { open } = freshRuntime();
    const index = open({ type: 1, content: ["page body", "ignored"] });
    results.typedContentTuple = {
      renderedText: layerRoot(index).querySelector(".layer-esm__content")
        .textContent,
    };
  }

  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
  activeDom?.window.close();
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
