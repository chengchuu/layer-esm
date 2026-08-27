# layer-esm v1.0.1: 面向现代 Web 项目的 Layer 风格弹层库

![layer-esm](http://blog.mazey.net/wp-content/uploads/2026/06/layer-esm-SF-s7x3.jpg)

layer-esm 将熟悉的 Layer 风格命令式 API 带入基于 npm 的浏览器项目。v1.0.1 同时提供
ESM、CommonJS 和 TypeScript 类型声明。应用可以按需导入 API，不再依赖全局
window.layer 对象。

- [`layer-esm` 的定位](#layer-esm-的定位)
- [安装与导入](#安装与导入)
  - [安装](#安装)
  - [导入所需 API](#导入所需-api)
- [基本用法](#基本用法)
  - [使用 `msg` 显示消息](#使用-msg-显示消息)
  - [使用 `confirm` 请求确认](#使用-confirm-请求确认)
  - [使用 `load` 标识加载状态](#使用-load-标识加载状态)
- [从旧版 Layer 迁移](#从旧版-layer-迁移)
  - [更改接入方式](#更改接入方式)
  - [替换常用 API](#替换常用-api)
  - [逐步完成迁移](#逐步完成迁移)
- [内容安全](#内容安全)
- [版权声明](#版权声明)


## `layer-esm` 的定位

`layer-esm` 面向 Web 应用提供弹层、消息提示和对话框能力。常用方法仍包括 `msg`、`confirm` 和 `load`。主要变化在于接入方式: 旧版代码依赖全局 `window.layer`，新代码则从 npm 包导入所需 API。

## 安装与导入

### 安装

通过 npm 安装 `layer-esm`:

```bash
npm install layer-esm
```

### 导入所需 API

从包中导入所需 API，可以明确展示当前模块的依赖:

```javascript
import { close, confirm, load, msg } from "layer-esm";
```

如果命名空间形式更便于迁移，也可以使用默认导出:

```javascript
import layer from "layer-esm";

layer.msg("保存成功");
```

## 基本用法

### 使用 `msg` 显示消息

`msg` 适合显示保存成功、操作完成和轻量提醒等短消息:

```javascript
import { msg } from "layer-esm";

msg("保存成功");
```

### 使用 `confirm` 请求确认

当用户必须决定是否继续操作时，可以使用 `confirm`:

```javascript
import { confirm, msg } from "layer-esm";

confirm("是否继续删除这条记录？", {
  btn: [ "删除", "取消" ],
}, () => {
  msg("已删除");
}, () => {
  msg("已取消");
});
```

第一个回调处理主按钮。第二个回调处理第二个按钮。

### 使用 `load` 标识加载状态

`load` 返回弹层索引。任务结束后，将该索引传给 `close`:

```javascript
import { close, load } from "layer-esm";

const loadingIndex = load();

setTimeout(() => {
  close(loadingIndex);
}, 1500);
```

`load` 支持 3 种加载样式:

```javascript
load(0);
load(1);
load(2);
```

无论任务成功还是失败，都应关闭加载弹层。这样可以避免页面残留加载状态。

## 从旧版 Layer 迁移

### 更改接入方式

迁移的主要变化是使用包导入替代全局脚本依赖。

旧版写法:

```html
<script src="layer.js"></script>
<script>
  layer.msg("保存成功");
</script>
```

`layer-esm` 写法:

```javascript
import { msg } from "layer-esm";

msg("保存成功");
```

### 替换常用 API

**消息提示**

旧版写法:

```javascript
layer.msg("一段提示信息");
```

`layer-esm` 写法:

```javascript
import { msg } from "layer-esm";

msg("一段提示信息");
```

**确认对话框**

旧版写法:

```javascript
layer.confirm("如何看待前端开发？", {
  btn: ["重要", "特别"],
}, function () {
  layer.msg("确实很重要");
}, function () {
  layer.msg("这种回答也可以");
});
```

`layer-esm` 写法:

```javascript
import { confirm, msg } from "layer-esm";

confirm("如何看待前端开发？", {
  btn: [ "重要", "特别" ],
}, () => {
  msg("确实很重要");
}, () => {
  msg("这种回答也可以");
});
```

**加载提示**

旧版写法:

```javascript
var index = layer.load();

setTimeout(function () {
  layer.close(index);
}, 1500);
```

`layer-esm` 写法:

```javascript
import { close, load } from "layer-esm";

const index = load();

setTimeout(() => {
  close(index);
}, 1500);
```

### 逐步完成迁移

建议先迁移 `msg`、`confirm` 和 `load` 等高频调用。仅导入当前模块使用的方法，可以减少 `layer.xxx` 形式的层级访问，也便于识别依赖。

按页面或功能模块逐步替换弹层逻辑。可以先处理保存提示、删除确认和加载遮罩。确认这些场景行为正确后，再迁移其他能力。删除旧版依赖前，请验证选项和回调行为。

## 内容安全

为了兼容 Layer，字符串类型的 `content` 会被视为可信 HTML。请勿直接传入不可信的用户输入。应当先清理不可信标记，或者在需要结构化 DOM 内容时使用 `HTMLElement`。

## 版权声明

本文为原创文章，作者保留版权。转载请保留本文完整内容，并以超链接形式注明作者及原文出处。

作者: [除除](https://github.com/chengchuu)
原文: <http://blog.mazey.net/6443.html>

<!-- ID: RELEASE_NOTES/introducing-layer-esm-v1.0.1.zh-CN -->
