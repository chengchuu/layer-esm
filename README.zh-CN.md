# layer-esm

[English](./README.md) | 简体中文

[![npm version][npm-image]][npm-url]
[![l][l-image]][l-url]

[npm-image]: https://img.shields.io/npm/v/layer-esm
[npm-url]: https://npmjs.org/package/layer-esm
[l-image]: https://img.shields.io/npm/l/layer-esm
[l-url]: https://github.com/chengchuu/layer-esm

特别感谢 Xianxin。他是 Layer 的原作者，并创建了这一在 Web 社区广泛使用多年的弹层库。
`layer-esm` 是受原版 Layer API 启发的现代 TypeScript 实现。

- [项目网站](https://chengchuu.github.io/layer-esm/)
- [在线演示](https://chengchuu.github.io/layer-esm/playground/)
- [API 文档](https://chengchuu.github.io/layer-esm/api/)

## 安装

```bash
npm install layer-esm
```

## 用法

```javascript
import { close, confirm, load, msg } from "layer-esm";

const loadingIndex = load();

confirm("Continue?", {}, () => {
  msg("Confirmed", { icon: "success" });
  close(loadingIndex);
});
```

## 图标

新代码建议使用有类型约束的名称。为兼容数值写法，也可以使用对应的数值。所选
Bootstrap Icons 的 SVG 路径已嵌入 JavaScript 构建产物，并继承 `currentColor`。
使用时无须加载额外的样式表、字体、图片或网络资源。

| 名称       | 数值 | Bootstrap Icon   |
| :--------- | :--- | :--------------- |
| `warning`  | `0`  | `exclamation-lg` |
| `success`  | `1`  | `check-lg`       |
| `error`    | `2`  | `x-lg`           |
| `question` | `3`  | `question-lg`    |
| `lock`     | `4`  | `lock-fill`      |
| `sad`      | `5`  | `emoji-frown`    |
| `smile`    | `6`  | `emoji-smile`    |

```javascript
msg("Saved", { icon: "success" });
alert("Delete this item?", { icon: "warning" });
```

`load(0)`、`load(1)` 和 `load(2)` 保留 CSS 动画加载样式。使用 `load("success")` 等名称时，
`load` 会改为渲染对应的静态状态图标。传入未知字符串名称时，函数会在创建弹层前抛出
`TypeError`。

对话框提供带标签的对话框语义、焦点陷阱、Escape 键处理和焦点恢复。消息使用 `polite`
实时区域，标签页支持方向键导航，`prompt` 输入控件具有标签。装饰性 SVG 图标不会暴露给
辅助技术，动画也会遵循减少动态效果的系统设置。为兼容 Layer，字符串类型的 `content`
会被视为可信 HTML。需要结构化 DOM 内容时，优先使用 `HTMLElement`。传入不可信标记前，
必须先进行清理。动态标题始终按文本渲染。

## 主题

未配置主题时，程序会读取一次操作系统的主题偏好，并在运行时生命周期内缓存该结果。
无法确定系统偏好时，程序会使用浅色主题。显式设置 `config({ theme })` 会覆盖自动选择的
初始主题。`system` 设置会继续响应运行时的 `prefers-color-scheme` 变化。部分自定义主题
会与安全的浅色默认值合并。

```javascript
import { config, darkTheme, lightTheme } from "layer-esm";

config({ theme: "dark" });
config({ theme: "system" });
config({ theme: { primary: "#7c3aed", radius: "16px" } });
```

包还导出了 `lightTheme` 和 `darkTheme`，可用于带类型约束的主题组合。

## 内容安全策略

styled-components 会将生成的样式规则注入目标文档。启用内容安全策略 (Content Security
Policy，CSP) 的网站可以附加现有 `nonce`:

```javascript
import { config } from "layer-esm";

config({ styleNonce: window.__CSP_NONCE__ });
```

原有的 `injectStyles: false` 和可复用 `layerStyles` 方案无法表示动态的 styled-components
主题。`layerStyles` 仍作为已弃用的兼容标记保留。调用 `config({ injectStyles: false })`
时，程序会抛出明确的迁移错误，而不是在没有样式的情况下继续渲染对话框。

## 架构与生命周期

调用显示 API 时，程序会为每个目标 `Document` 延迟创建一个共享 React 根节点。类型化命令
会更新一个小型外部存储，所有活动弹层都通过这个宿主渲染。`close` 会清除计时器和回调，
并恢复移动的 DOM 节点、滚动状态和焦点。启用退出过渡时，`close` 还会等待过渡结束。

宿主会持续复用，直至 `destroy()` 明确关闭宿主所管理的记录并卸载根节点。导入包时不会
访问 DOM。在没有浏览器 `Document` 的环境中调用显示 API，会抛出明确的错误。

支持的浏览器基线为 Chrome、Edge、Firefox 和 Safari 的最近两个版本，以及 Chrome for
Android 100+ 和 iOS Safari 15+。包不会安装全局 polyfill。

## 指南

- [layer-esm v1.0.1: 面向现代 Web 项目的 Layer 风格弹层库](./guides/RELEASE_NOTES/introducing-layer-esm-v1.0.1.zh-CN.md)
- [发布说明索引](./guides/README.md)

## 参与贡献

### 开发环境

| 依赖       | 版本     |
| :--------- | :------- |
| Node.js    | v22.21.1 |
| TypeScript | v5.3.2   |

### 脚本

```bash
pnpm install
npm run dev
npm run build
npm test
npm test -- test/layer.test.js
npm run docs
```

## 许可证

本软件根据 [MIT 许可证](https://github.com/chengchuu/layer-esm/blob/main/LICENSE)发布。
