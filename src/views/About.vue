<template>
  <div class="about">
    <article class="weui-article">
      <h1>轩轩五子棋</h1>
      <section>
        <section>
          <h3>这是什么</h3>
          <p>
            这是一个开源的五子棋AI，纯JS代码，浏览中运行（不需要和后台通信）。AI具有一定的棋力，并且可以自由调节难度。
          </p>
        </section>
        <section>
          <h3>源码和文档</h3>
          <p>
            <ul>
              <li>
                源码在这里: <a href="https://github.com/lihongxun945/gobang" target="_blank">lihongxun945/gobang</a>
              </li>
              <li>有一个手把手的详细教程教你怎么写五子棋AI，版本比较旧，但是仍然值得一看 <a href="https://blog.csdn.net/lihongxun945/article/category/6089493">五子棋AI算法-言川的博客</a></li>
            </ul>
          </p>
        </section>
        <section>
          <h3>AI 用到了什么技术</h3>
          <p>
            这是一个基于Alpha-Beta Search的AI。主要用到了如下技术：
            <ul>
              <li>Alpha Beta Search</li>
              <li>Zobrist 置换表</li>
              <li>启发式评估函数</li>
              <li>迭代加深</li>
            </ul>
          </p>
        </section>
        <section>
          <h3>这个UI用到了什么技术？</h3>
          <p>
            UI 是用 Vue 写的，主要用到了 <a href="https://weui.io/" target="_blank">WeUI</a> 中的一些样式。
          </p>
        </section>
        <section>
          <h3>关于作者</h3>
          <p>
            作者@言川, 我的github主页 <a href="https://github.com/lihongxun945">lihongxun945</a>
          </p>
        </section>

      </section>
    </article>
  </div>
</template>

<style lang="scss" scoped>
@import '../variables.scss';
h1, h2, h3 {
  color: $primary-color;
}
</style>
