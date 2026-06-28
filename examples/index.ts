import { getBrowserInfo } from "mazey";
import {
  alert,
  close,
  closeAll,
  confirm,
  full,
  load,
  min,
  msg,
  open,
  prompt,
  restore,
  tab,
  tips,
  title,
} from "../src";

const app = document.querySelector(".container");
const { colorScheme } = getBrowserInfo();
const isDarkMode = colorScheme === "dark";

if (isDarkMode) {
  document.documentElement.setAttribute("data-bs-theme", "dark");
  document.body.style.backgroundColor = "#052e16";
}

const iframeHtml = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>layer-esm iframe demo</title>
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg, #0d6efd, #6f42c1);
      color: #fff;
      display: grid;
      min-height: 100vh;
      place-items: center;
    }
    .frame-card {
      width: min(88vw, 480px);
      border-radius: 16px;
      padding: 24px;
      background: rgba(255, 255, 255, 0.14);
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.18);
      backdrop-filter: blur(8px);
    }
    h1 {
      margin: 0 0 8px;
      font-size: 24px;
    }
    p {
      margin: 0 0 12px;
      line-height: 1.7;
    }
  </style>
</head>
<body>
  <div class="frame-card">
    <h1>layer-esm iframe demo</h1>
    <p>This iframe is loaded from a data URL so the fullscreen example works without an external site.</p>
    <p>You can close this layer from the main page controls.</p>
  </div>
</body>
</html>
`;

const iframeUrl = `data:text/html;charset=utf-8,${encodeURIComponent(iframeHtml)}`;

if (app) {
  app.innerHTML = `
    <div class="py-5">
      <div class="row justify-content-center">
        <div class="col-12 col-xl-11">
          <section class="rounded-4 border border-primary-subtle bg-white shadow-sm overflow-hidden mb-4">
            <div class="row g-0">
              <div class="col-lg-8 p-4 p-lg-5">
                <span class="badge rounded-pill text-bg-primary mb-3">Demo Gallery</span>
                <h1 class="display-6 fw-bold mb-3">layer-esm example playground</h1>
                <p class="lead text-secondary mb-3">
                  Bootstrap-style examples for alerts, confirms, messages, captured pages, tips, loading states,
                  prompts, tabs, fullscreen iframes, and more.
                </p>
                <div class="d-flex flex-wrap gap-2">
                  <button class="btn btn-primary" data-demo="alert-basic">Alert</button>
                  <button class="btn btn-outline-primary" data-demo="confirm-basic">Confirm</button>
                  <button class="btn btn-outline-secondary" data-demo="message-basic">Message</button>
                  <button class="btn btn-outline-dark" data-demo="loading-0">Loading</button>
                </div>
              </div>
              <div class="col-lg-4 bg-primary-subtle border-start">
                <div class="p-4 h-100 d-flex flex-column justify-content-center">
                  <h2 class="h5 fw-semibold mb-3">Supported demos</h2>
                  <ul class="list-unstyled small text-secondary mb-0">
                    <li class="mb-2">• Native ESM API with Layer-style method names</li>
                    <li class="mb-2">• CSS-based loading indicators and runtime-injected styles</li>
                    <li class="mb-2">• Page capture, prompt chaining, directional tips, and tabs</li>
                    <li>• Fullscreen iframe and minimize/restore examples</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <div class="row g-4">
            <div class="col-md-6 col-xl-4">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <h2 class="h5 card-title">Alert & Confirm</h2>
                  <p class="card-text text-secondary">Simple alert dialogs plus a confirm flow modeled after the classic Layer examples.</p>
                  <div class="d-grid gap-2">
                    <button class="btn btn-primary" data-demo="alert-basic">Alert: 内容</button>
                    <button class="btn btn-outline-primary" data-demo="alert-icon">Alert with icon</button>
                    <button class="btn btn-outline-secondary" data-demo="confirm-basic">Confirm: 前端开发</button>
                    <button class="btn btn-outline-dark" data-demo="countdown-alert">Auto-close countdown title</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-6 col-xl-4">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <h2 class="h5 card-title">Message Variants</h2>
                  <p class="card-text text-secondary">Toast-style messages, custom buttons, icons, offsets, and click-driven follow-ups.</p>
                  <div class="d-grid gap-2">
                    <button class="btn btn-success" data-demo="message-basic">Plain message</button>
                    <button class="btn btn-outline-success" data-demo="message-icon">Message with icon</button>
                    <button class="btn btn-outline-warning" data-demo="message-buttons">Message with buttons</button>
                    <button class="btn btn-outline-info" data-demo="message-top">Top offset message</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-6 col-xl-4">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <h2 class="h5 card-title">Captured Page Layer</h2>
                  <p class="card-text text-secondary">Reuses an existing DOM block, similar to the legacy “捕获页” example.</p>
                  <button class="btn btn-dark w-100 mb-3" data-demo="capture-page">Open captured card</button>
                  <div id="capture-source" class="rounded-3 border border-info-subtle bg-info-subtle p-3 d-none">
                    <span class="badge text-bg-info mb-2">Captured element</span>
                    <h3 class="h5">Page capture content</h3>
                    <p class="text-secondary mb-2">
                      This content already exists in the page and is temporarily moved into a layer container.
                    </p>
                    <ul class="mb-0 text-secondary">
                      <li>Great for notices and embedded forms</li>
                      <li>Restored to the page when the layer closes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-6 col-xl-4">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <h2 class="h5 card-title">Tips</h2>
                  <p class="card-text text-secondary">Four directions and color customization, attached to a single target element.</p>
                  <div class="rounded-4 border border-primary-subtle bg-primary-subtle p-4 text-center mb-3">
                    <button id="tips-target" class="btn btn-light border shadow-sm">Hover target replacement</button>
                  </div>
                  <div class="row g-2">
                    <div class="col-6"><button class="btn btn-outline-primary w-100" data-demo="tips-top">Top</button></div>
                    <div class="col-6"><button class="btn btn-outline-primary w-100" data-demo="tips-right">Right</button></div>
                    <div class="col-6"><button class="btn btn-outline-primary w-100" data-demo="tips-bottom">Bottom</button></div>
                    <div class="col-6"><button class="btn btn-outline-primary w-100" data-demo="tips-left">Left</button></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-6 col-xl-4">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <h2 class="h5 card-title">Loading States</h2>
                  <p class="card-text text-secondary">Demonstrates the CSS-based loading styles from icon 0 through 2.</p>
                  <div class="d-grid gap-2">
                    <button class="btn btn-outline-dark" data-demo="loading-0">Loading style 0</button>
                    <button class="btn btn-outline-dark" data-demo="loading-1">Loading style 1</button>
                    <button class="btn btn-outline-dark" data-demo="loading-2">Loading style 2</button>
                    <button class="btn btn-outline-secondary" data-demo="loading-msg">Message-style loading</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-6 col-xl-4">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <h2 class="h5 card-title">Prompt & Tabs</h2>
                  <p class="card-text text-secondary">Prompt chaining for password and textarea input, plus a tabbed content layer.</p>
                  <div class="d-grid gap-2">
                    <button class="btn btn-outline-secondary" data-demo="prompt-chain">Prompt chain</button>
                    <button class="btn btn-outline-secondary" data-demo="tab-basic">Open tabs</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-6 col-xl-6">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <h2 class="h5 card-title">Window Controls</h2>
                  <p class="card-text text-secondary">Examples for scroll locking, minimize/restore, and a fullscreen iframe layer.</p>
                  <div class="d-grid gap-2">
                    <button class="btn btn-outline-dark" data-demo="scroll-lock">Lock scrollbar</button>
                    <button class="btn btn-outline-dark" data-demo="min-restore">Minimize then restore</button>
                    <button class="btn btn-outline-dark" data-demo="iframe-full">Open fullscreen iframe</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-md-6 col-xl-6">
              <div class="card shadow-sm h-100">
                <div class="card-body">
                  <h2 class="h5 card-title">Quick Actions</h2>
                  <p class="card-text text-secondary">Small, reusable calls inspired by the original docs.</p>
                  <div class="d-flex flex-wrap gap-2">
                    <button class="btn btn-sm btn-primary" data-demo="message-hi">Hi</button>
                    <button class="btn btn-sm btn-danger" data-demo="message-sauce">打酱油</button>
                    <button class="btn btn-sm btn-warning" data-demo="close-loading">Close all loading</button>
                    <button class="btn btn-sm btn-secondary" data-demo="close-all">Close all layers</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const captureSource = document.querySelector<HTMLElement>("#capture-source");

  const runLoading = (icon: number, options: NonNullable<Parameters<typeof load>[1]> = {}) => {
    const index = load(icon, {
      shade: false,
      content: `Loading style ${icon}...`,
      ...options,
    });

    window.setTimeout(() => {
      close(index);
      msg(`Loading style ${icon} finished.`, { icon: 1 });
    }, 1600);
  };

  const demoActions: Record<string, () => void> = {
    "alert-basic": () => {
      alert("内容");
    },
    "alert-icon": () => {
      alert("见到你真的很高兴", { icon: 6 });
    },
    "confirm-basic": () => {
      confirm("您是如何看待前端开发？", {
        btn: [ "重要", "奇葩" ],
      }, () => {
        msg("的确很重要", { icon: 1 });
      }, () => {
        msg("也可以这样", {
          time: 20,
          btn: [ "明白了", "知道了" ],
        });
      });
    },
    "message-basic": () => {
      msg("一段提示信息", { time: 5 });
    },
    "message-icon": () => {
      msg("常用提示", { icon: 5 });
    },
    "message-buttons": () => {
      msg("一个询问测试？", {
        time: 0,
        btn: [ "确定", "关闭" ],
        yes: (index) => {
          close(index);
          msg("自定义按钮", {
            icon: 6,
            time: 0,
            btn: [ "按钮-1", "按钮-2", "按钮-3" ],
          });
        },
      });
    },
    "message-top": () => {
      msg("灵活运用 offset", {
        offset: "t",
        anim: 6,
      });
    },
    "capture-page": () => {
      if (!captureSource) {
        return;
      }

      open({
        type: 1,
        shade: false,
        area: [ "460px", "320px" ],
        title: "捕获页示例",
        content: captureSource,
        cancel: () => {
          msg("捕获就是从页面已经存在的元素上，包裹 layer 的结构", {
            time: 5,
            icon: 6,
          });
        },
      });
    },
    "tips-top": () => {
      tips("上", "#tips-target", {
        tips: [ 1, "#0d6efd" ],
        time: 4,
      });
    },
    "tips-right": () => {
      tips("默认就是向右的", "#tips-target", {
        time: 4,
      });
    },
    "tips-bottom": () => {
      tips("下", "#tips-target", {
        tips: 3,
        time: 4,
      });
    },
    "tips-left": () => {
      tips("左边么么哒", "#tips-target", {
        tips: [ 4, "#198754" ],
        time: 4,
      });
    },
    "loading-0": () => {
      runLoading(0);
    },
    "loading-1": () => {
      runLoading(1, {
        shade: [ 0.1, "#fff" ],
      });
    },
    "loading-2": () => {
      runLoading(2);
    },
    "loading-msg": () => {
      msg("加载中", {
        icon: 16,
        shade: 0.01,
        time: 2,
      });
    },
    "prompt-chain": () => {
      prompt({
        title: "输入任何口令，并确认",
        formType: 1,
      }, (password, index) => {
        close(index);
        prompt({
          title: "随便写点啥，并确认",
          formType: 2,
        }, (text, nextIndex) => {
          close(nextIndex);
          alert(`演示完毕！测试口令为：${password}<br>最后写下了：${text}`);
        });
      });
    },
    "tab-basic": () => {
      tab({
        area: [ "640px", "340px" ],
        tab: [
          {
            title: "TAB1",
            content: "<p class='mb-0'>内容1：Layer 风格 API 的 ESM 版本。</p>",
          },
          {
            title: "TAB2",
            content: "<p class='mb-0'>内容2：运行时样式和 CSS loading 已内联。</p>",
          },
          {
            title: "TAB3",
            content: "<p class='mb-0'>内容3：可以继续补充 photos 等高级能力。</p>",
          },
        ],
      });
    },
    "countdown-alert": () => {
      let timerId = 0;

      alert("在标题栏显示自动关闭倒计秒数", {
        time: 5,
        success: (layero) => {
          let seconds = 5;
          const index = Number(layero.dataset.index);
          title(`${seconds} 秒后关闭`, index);

          timerId = window.setInterval(() => {
            seconds -= 1;
            if (seconds > 0) {
              title(`${seconds} 秒后关闭`, index);
              return;
            }

            window.clearInterval(timerId);
          }, 1000);
        },
        end: () => {
          if (timerId) {
            window.clearInterval(timerId);
          }
        },
      });
    },
    "scroll-lock": () => {
      open({
        title: "滚动条锁定",
        content: "浏览器滚动条已锁。关闭此层后会恢复。",
        scrollbar: false,
      });
    },
    "min-restore": () => {
      const index = open({
        type: 1,
        title: "最小化示例",
        content: "<p class='mb-0'>此层会自动最小化，然后再恢复。</p>",
        area: [ "420px", "220px" ],
        maxmin: true,
      });

      window.setTimeout(() => {
        min(index);
      }, 800);

      window.setTimeout(() => {
        restore(index);
        msg("已自动恢复窗口。", { icon: 1 });
      }, 2200);
    },
    "iframe-full": () => {
      const index = open({
        type: 2,
        title: "全屏 iframe 示例",
        content: [ iframeUrl, "auto" ],
        area: [ "520px", "360px" ],
        maxmin: true,
      });

      full(index);
      msg("已切换到全屏 iframe 示例。", { icon: 1 });
    },
    "message-hi": () => {
      msg("Hi");
    },
    "message-sauce": () => {
      msg("尼玛，打个酱油", { icon: 4 });
    },
    "close-loading": () => {
      closeAll("loading", () => {
        msg("所有 loading 层都已关闭。");
      });
    },
    "close-all": () => {
      closeAll(() => {
        msg("所有 layer 都已关闭。");
      });
    },
  };

  document.querySelectorAll<HTMLElement>("[data-demo]").forEach((button) => {
    button.addEventListener("click", () => {
      demoActions[button.dataset.demo || ""]?.();
    });
  });

  msg("Hi，欢迎体验 layer-esm 示例页", {
    offset: "t",
    anim: 6,
  });
}
