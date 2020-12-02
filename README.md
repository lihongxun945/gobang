## 五子棋AI

***仅供业余研究AI用，代码有很多不完善的地方，精力和专业所限请谅解***

***2020/11/29 更新，修复了评分的明显bug，随机开局库可配置，网站已修复，可以愉快玩耍了***

![二维码](./images/gobang.png)

极大极小值算法的五子棋AI实现。 扫描上方二维码，或者打开此页面可以直接体验 [http://gobang.light7.cn/](http://gobang.light7.cn/)


![截图](./images/ss.png)


## 教程
我写了非常详细的中文教程，教你如何一步步编写自己的五子棋AI：

- [五子棋AI设计教程第二版一：前言](https://github.com/lihongxun945/myblog/issues/11)
- [五子棋AI设计教程第二版二：博弈算法的前世今生](https://github.com/lihongxun945/myblog/issues/12)
- [五子棋AI设计教程第二版三：极小化极大值搜索](https://github.com/lihongxun945/myblog/issues/13)
- [五子棋AI设计教程第二版四：Alpha Beta 剪枝算法](https://github.com/lihongxun945/myblog/issues/14)
- [五子棋AI设计教程第二版五：启发式评估函数](https://github.com/lihongxun945/myblog/issues/15)
- [五子棋AI设计教程第二版六：迭代加深](https://github.com/lihongxun945/myblog/issues/16)
- [五子棋AI设计教程第二版七：Zobrist缓存](https://github.com/lihongxun945/myblog/issues/17)
- [五子棋AI设计教程第二版八：算杀](https://github.com/lihongxun945/myblog/issues/18)
- [五子棋AI设计教程第二版九：性能优化](https://github.com/lihongxun945/myblog/issues/19)


## 安装依赖

先执行 `npm install` 安装依赖。然后有如下命令可用：

- `npm test`  运行单元测试
- `npm run js` 编译JS
- `npm run less` 编译less
- `npm run watch` 进入watch模式 自动编译文件
- `npm run build` 编译生成dist目录

## 基本算法

- 极大极小值搜索
- Alpha Beta剪枝
- 启发式评估函数
- Zobrist缓存
- 迭代加深
- ...
