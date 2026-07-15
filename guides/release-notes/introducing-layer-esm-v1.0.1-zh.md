# layer-esm v1.0.1 项目介绍 - 开始

![layer-esm](http://blog.mazey.net/wp-content/uploads/2026/06/layer-esm-SF-s7x3.jpg)

延续 "layer" 熟悉的调用方式，将弹层能力带入现代 ESM 开发环境。通过 "msg"、"confirm"、"load" 等示例，展示安装、导入、常见 API 对照与迁移思路，帮助项目逐步从全局 "window.layer" 切换到模块化使用模式。

- [layer-esm v1.0.1 项目介绍 - 开始](#layer-esm-v101-项目介绍---开始)
  - [致谢](#致谢)
  - [什么是 `layer-esm`](#什么是-layer-esm)
  - [安装与引入](#安装与引入)
    - [安装](#安装)
    - [引入](#引入)
  - [基本用法](#基本用法)
    - [`msg`](#msg)
    - [`confirm`](#confirm)
    - [`load`](#load)
  - [从旧版 `layer` 迁移](#从旧版-layer-迁移)
    - [接入方式的变化](#接入方式的变化)
    - [常见 API 对照](#常见-api-对照)
  - [迁移建议](#迁移建议)
    - [优先迁移高频调用](#优先迁移高频调用)
    - [优先使用具名导入](#优先使用具名导入)
    - [分页面推进](#分页面推进)
  - [总结](#总结)

## 致谢

介绍 [`layer-esm`](https://github.com/chengchuu/layer-esm) 之前，先感谢贤心。[`layer`](https://github.com/layui/layer) 曾经帮助很多前端项目快速落地弹层、提示和对话框能力。他的 API 简洁，使用体验直接，也影响了很多国内项目的交互实现方式。`layer-esm` 的出发点，不是割裂这套经验，而是把这套熟悉的调用方式带到现代模块化环境中。

## 什么是 `layer-esm`

`layer-esm` 是一个面向 Web 应用的现代弹层库。他保留了 `layer` 风格的 API，同时采用 ESM (ECMAScript Module，ECMAScript 模块) 形式发布，便于在现代构建工具中使用。如果已经熟悉旧版 `layer`，那么迁移到 `layer-esm` 的理解成本并不高。常见的方法名依然保持不变，例如 `msg`、`confirm` 和 `load`。他的主要变化不在交互形式，而在接入方式。过去的代码依赖全局 `window.layer`。现在的代码通过模块导入来使用能力。

## 安装与引入

### 安装

可以通过 npm (Node Package Manager，Node 包管理器) 安装 `layer-esm`。

```bash
npm install layer-esm
```

### 引入

推荐优先使用具名导入。这种写法更符合现代 ESM 代码风格，也更利于阅读。

```javascript
import { close, confirm, load, msg } from "layer-esm";
```

也可以使用默认导入，对于旧版 `layer` 的迁移来说，这种写法更接近原来的调用方式。

```javascript
import layer from "layer-esm";

layer.msg("保存成功");
```

## 基本用法

### `msg`

`msg` 适合展示短提示。他常用于保存成功、操作完成和轻量提醒等场景。

```javascript
import { msg } from "layer-esm";

msg("保存成功");
```

如果页面经常需要即时反馈，建议优先从 `msg` 开始迁移。

### `confirm`

`confirm` 适合在用户继续操作前，给出一次明确确认。

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

这种写法与旧版 `layer` 的思路基本一致。第一个回调处理确认动作，第二个回调处理取消动作。

### `load`

`load` 适合表示异步任务正在进行。可以把他用于接口请求、初始化流程和后台处理提示。

```javascript
import { close, load } from "layer-esm";

const loadingIndex = load();

setTimeout(() => {
  close(loadingIndex);
}, 1500);
```

`load` 支持多种样式。

```javascript
load(0);
load(1);
load(2);
```

如果只需要一个简单的加载提示，这种调用方式已经足够。

## 从旧版 `layer` 迁移

### 接入方式的变化

迁移中最重要的变化，是从全局脚本依赖切换到模块导入。

旧写法:

```html
<script src="layer.js"></script>
<script>
  layer.msg("保存成功");
</script>
```

新写法:

```javascript
import { msg } from "layer-esm";

msg("保存成功");
```

### 常见 API 对照

**消息提示**

旧写法:

```javascript
layer.msg("一段提示信息");
```

新写法:

```javascript
import { msg } from "layer-esm";

msg("一段提示信息");
```

**确认对话框**

旧写法:

```javascript
layer.confirm("如何看待前端开发？", {
  btn: ["重要", "特别"],
}, function () {
  layer.msg("确实很重要");
}, function () {
  layer.msg("这种回答也可以");
});
```

新写法:

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

旧写法:

```javascript
var index = layer.load();

setTimeout(function () {
  layer.close(index);
}, 1500);
```

新写法:

```javascript
import { close, load } from "layer-esm";

const index = load();

setTimeout(() => {
  close(index);
}, 1500);
```

## 迁移建议

### 优先迁移高频调用

建议先迁移 `msg`、`confirm` 和 `load`。这 3 个方法通常最常用，也最容易统一替换。

### 优先使用具名导入

如果只需要少量 API，直接导入具体方法会更清晰。

```javascript
import { close, load, msg } from "layer-esm";
```

这种写法可以减少 `layer.xxx` 形式的层级访问，也更符合现代模块代码的阅读习惯。

### 分页面推进

不要一次性重写全部弹层逻辑。更稳妥的做法，是按页面或按功能模块逐步替换。

可以先处理保存提示、删除确认和加载遮罩。等这些高频场景稳定后，再继续扩展到其他能力。

## 总结

`layer-esm` 延续了 `layer` 的调用风格，也适应了现代前端工程的使用方式。如果项目当前大量依赖 `msg`、`confirm` 和 `load`，那么迁移成本通常不高。只需要完成安装、改成模块导入，并逐步替换旧的全局调用。

再次感谢贤心为 `layer` 打下的基础。`layer-esm` 希望在这份经验之上，继续提供一个更适合现代项目的弹层方案。

**版权声明**

本文为原创文章，作者保留版权。转载请保留本文完整内容，并以超链接形式注明作者及原文出处。

作者: [除除](https://github.com/chengchuu)
原文: <http://blog.mazey.net/6443.html>

<!-- ID: introducing-layer-esm-v1.0.1-zh -->

(完)
