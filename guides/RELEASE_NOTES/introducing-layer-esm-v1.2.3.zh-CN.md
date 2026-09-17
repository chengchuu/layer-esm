# layer-esm v1.2.3: 消息提示、对话框与图标

保存成功时给出一句提示，继续操作前请用户确认，这些都是网页中的常见需求。`layer-esm` 提供了对应的方法，导入后即可调用。本文从 `msg` 和 `alert` 开始，再介绍图标和其他常用方法。

- [安装](#安装)
- [快速开始](#快速开始)
  - [`msg`: 消息提示](#msg-消息提示)
  - [`alert`: 提醒对话框](#alert-提醒对话框)
- [Icon: 消息图标](#icon-消息图标)
- [更多常用方法](#更多常用方法)
  - [`confirm`: 操作确认](#confirm-操作确认)
  - [`load`: 加载状态](#load-加载状态)
  - [`tips`: 元素提示](#tips-元素提示)
  - [`prompt`: 文本输入](#prompt-文本输入)
  - [`tab`: 选项卡](#tab-选项卡)
  - [`open`: 自定义对话框](#open-自定义对话框)

## 安装

```bash
npm install layer-esm
```

## 快速开始

### `msg`: 消息提示

保存成功、操作完成等简短反馈，可以使用 `msg`:

```javascript
import { msg } from "layer-esm";

msg("保存成功");
```

消息默认在 3 秒后自动关闭，不需要用户点击按钮。

### `alert`: 提醒对话框

需要用户阅读并点击按钮关闭的提醒，可以使用 `alert`:

```javascript
import { alert } from "layer-esm";

alert("请先填写昵称。");
```

对话框带有一个 `OK` 按钮。点击后，对话框关闭。

## Icon: 消息图标

通过 `icon` 选项，可以为消息添加图标。以下是可用的图标名称:

| 图标名称   | 含义 |
|:-----------|:-----|
| `warning`  | 警告 |
| `success`  | 成功 |
| `error`    | 错误 |
| `question` | 疑问 |
| `lock`     | 锁   |
| `sad`      | 难过 |
| `smile`    | 微笑 |

例如，为保存成功的消息添加一个成功图标:

```javascript
import { msg } from "layer-esm";

msg("保存成功", { icon: "success" });
```

将 `success` 换成表中的其他名称，就能使用对应的图标。图标已内置，无需额外安装图标包或加载样式文件。

## 更多常用方法

### `confirm`: 操作确认

需要用户选择是否继续时，可以使用 `confirm`:

```javascript
import { close, confirm, msg } from "layer-esm";

confirm("是否继续？", { btn: ["继续", "取消"] }, (index) => {
  close(index);
  msg("你选择了继续");
});
```

点击"继续"后执行回调。`index` 是当前对话框的编号，传给 `close` 即可关闭对话框。点击"取消"则直接关闭。

### `load`: 加载状态

任务进行中，可以使用 `load` 提示用户等待:

```javascript
import { close, load } from "layer-esm";

const loadingIndex = load();

setTimeout(() => {
  close(loadingIndex);
}, 1500);
```

这个例子用定时器模拟等待，1.5 秒后关闭加载提示。`load` 默认不会自动关闭。实际使用时，无论任务成功还是失败，都应调用 `close` 结束加载状态。

`load(0)`、`load(1)` 和 `load(2)` 对应 3 种加载动画。字符串名称对应的是静态状态图标，不是加载动画。

### `tips`: 元素提示

需要在输入框旁边补充说明时，可以使用 `tips`。先在页面中放置一个输入框:

```html
<input id="nickname" aria-label="昵称" placeholder="请输入昵称" />
```

在输入框已加载到页面后，运行以下代码:

```javascript
import { tips } from "layer-esm";

tips("填写你希望别人看到的名字", "#nickname", { time: 3 });
```

`#nickname` 指向上面的输入框。提示出现在输入框旁，3 秒后自动关闭。

### `prompt`: 文本输入

需要用户输入一段文字时，可以使用 `prompt`:

```javascript
import { close, prompt } from "layer-esm";

prompt({ title: "请输入昵称" }, (value, index) => {
  console.log("输入的昵称：", value);
  close(index);
});
```

输入非空文字并点击 `OK` 后，回调收到输入值 `value` 和对话框编号 `index`。这个例子将昵称输出到浏览器控制台，然后关闭对话框。

### `tab`: 选项卡

需要在一个对话框里切换不同内容时，可以使用 `tab`:

```javascript
import { tab } from "layer-esm";

tab({
  tab: [
    { title: "介绍", content: "欢迎使用这个工具。" },
    { title: "帮助", content: "遇到问题时，请联系管理员。" },
  ],
});
```

点击"介绍"或"帮助"，即可切换对应内容。

### `open`: 自定义对话框

需要自己设置标题、内容和按钮时，可以使用 `open`:

```javascript
import { open } from "layer-esm";

open({
  title: "使用说明",
  content: "填写信息后，点击页面上的保存按钮。",
  btn: ["知道了"],
});
```

`title` 设置标题，`content` 设置内容，`btn` 设置按钮文字。这个例子没有自定义按钮回调，点击"知道了"即可关闭对话框。

字符串内容会按 HTML 处理，请勿直接传入未经处理的用户 HTML。
