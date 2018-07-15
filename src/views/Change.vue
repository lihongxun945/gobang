<template>
  <div class="about">
    <article class="weui-article">
      <h1>更新日志</h1>
      <section>
        <section>
          <h3>V3.0.0-beta.3 2018-07-15</h3>
          <p>
            <ul>
              <li>修复了有时候会忽略冲四和活四导致的bug</li>
            </ul>
          </p>
        </section>
        <section>
          <h3>V3.0.0-beta.2 2018-07-10</h3>
          <p>
            <ul>
              <li>修复了电脑会忽略最右一列的bug</li>
              <li>修复了显示序号设置不生效的bug</li>
              <li>增加了一个更新日志页面</li>
            </ul>
          </p>
        </section>
        <section>
          <h3>V3.0.0-beta.1 2018-07-09</h3>
          <p>
            <ul>
              <li>加快了运算速度，平均步时 &lt; 10s</li>
            </ul>
          </p>
        </section>
        <section>
          <h3>V3.0.0-beta 2018-07-07</h3>
          <p>
            <ul>
              <li>更新了基于Vue的全新UI界面，更加友好方便</li>
            </ul>
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
