reference these cases to modify the code in `layer-esm/examples/index.ts`. And use the bootstrap style to make the examples look better. You can also add more examples to demonstrate the usage of the library.

```js
//Alert

layer.alert('内容')

//Confirm

layer.confirm('您是如何看待前端开发？', {
  btn: ['重要','奇葩'] //按钮
}, function(){
  layer.msg('的确很重要', {icon: 1});
}, function(){
  layer.msg('也可以这样', {
    time: 20000, //20s后自动关闭
    btn: ['明白了', '知道了']
  });
});

//Message

layer.msg('一段提示信息');

//捕获页

layer.open({
  type: 1,
  shade: false,
  //title: false, //是否显示标题
  content: $('.layer_notice'), //捕获的元素，注意：最好该指定的元素要存放在body最外层，否则可能被其它的相对元素所影响
  cancel: function(){
    layer.msg('捕获就是从页面已经存在的元素上，包裹layer的结构', {time: 5000, icon:6});
  }
});

//Tips

layer.tips('Hi，我是tips', '吸附元素选择器，如#id');

//Loading

var index = layer.load(0, {shade: false}); //0代表加载的风格，支持0-2

//Loading层

var index = layer.load(1, {
  shade: [0.1,'#fff'] //0.1透明度的白色背景
});

//Tips

layer.tips('我是另外一个tips，只不过我长得跟之前那位稍有些不一样。', '吸附元素选择器', {
  tips: [1, '#3595CC'],
  time: 4000
});

//Prompt

layer.prompt({title: '输入任何口令，并确认', formType: 1}, function(pass, index){
  layer.close(index);
  layer.prompt({title: '随便写点啥，并确认', formType: 2}, function(text, index){
    layer.close(index);
    alert('演示完毕！您填写的的测试口令为：'+ pass +'<br>您最后写下了：'+ text);
  });
});

//tab 层

layer.tab({
  area: ['600px', '300px'],
  tab: [{
    title: 'TAB1',
    content: '内容1'
  }, {
    title: 'TAB2',
    content: '内容2'
  }, {
    title: 'TAB3',
    content: '内容3'
  }]
});

//图片层

$.getJSON('test/photos.json?v='+new Date, function(json){
  layer.photos({
    photos: json //格式见API文档手册页
    ,anim: 5 //0-6的选择，指定弹出图片动画类型，默认随机
  });
});

//显示自动关闭倒计秒数

layer.alert('在标题栏显示自动关闭倒计秒数', {
  time: 5*1000
  ,success: function(layero, index){
    var timeNum = this.time/1000, setText = function(start){
      layer.title((start ? timeNum : --timeNum) + ' 秒后关闭', index);
    };
    setText(!0);
    this.timer = setInterval(setText, 1000);
    if(timeNum <= 0) clearInterval(this.timer);
  }
  ,end: function(){
    clearInterval(this.timer);
  }
});

//信息框-例1

layer.alert('见到你真的很高兴', {icon: 6});

//信息框-例2

layer.msg('一个询问测试？', {
  time: 0 //不自动关闭
  ,btn: ['确定', '关闭']
  ,yes: function(index){
    layer.close(index);
    layer.msg('自定义按钮', {
      icon: 6
      ,time: 0
      ,btn: ['按钮-1','按钮-2','按钮-3']
    });
  }
});

//信息框-例3

layer.msg('常用提示');

//信息框-例4

layer.msg('常用提示', {icon: 5});

//信息框-例5

layer.msg('常用提示', function(){
//关闭后的操作
});

layer.msg('点击任意处关闭');

//加载层-默认风格

layer.load();
//此处演示关闭
setTimeout(function(){
  layer.closeAll('loading');
}, 2000);

//加载层-风格2

layer.load(1);
//此处演示关闭
setTimeout(function(){
  layer.closeAll('loading');
}, 2000);

//加载层-风格3

layer.load(2);
//此处演示关闭
setTimeout(function(){
  layer.closeAll('loading');
}, 2000);

//加载层-风格4

layer.msg('加载中', {
  icon: 16
  ,shade: 0.01
});

//打酱油

layer.msg('尼玛，打个酱油', {icon: 4});

//tips层-上

layer.tips('上', '#id或者.class', {
  tips: [1, '#0FA6D8'] //还可配置颜色
});

//tips层-右

layer.tips('默认就是向右的', '#id或者.class');

//tips层-下

layer.tips('下', '#id或者.class', {
  tips: 3
});

//tips层-左

layer.tips('左边么么哒', '#id或者.class', {
  tips: [4, '#78BA32']
});

//tips层-不销毁之前的

layer.tips('不销毁之前的', '#id或者.class', {
  tipsMore: true
});

//默认prompt

layer.prompt(function(val, index){
  layer.msg('得到了'+val);
  layer.close(index);
});

//屏蔽浏览器滚动条

layer.open({
  content: '浏览器滚动条已锁',
  scrollbar: false
});

//弹出即全屏

var index = layer.open({
  type: 2,
  content: 'https://dev.layuion.com/jump/alyhot/',
  area: ['320px', '195px'],
  maxmin: true
});
layer.full(index);

//正上方

layer.msg('灵活运用 offset', {
  offset: 't',
  anim: 6
});

//更多例子
layer.msg('Hi');
```
