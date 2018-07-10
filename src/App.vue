<template>
  <div id="app">
    <keep-alive>
      <router-view/>
    </keep-alive>
    <div class="weui-tabbar">
      <router-link to="/" class="weui-tabbar__item">
        <span style="display: inline-block;position: relative;">
          <div alt="" class="weui-tabbar__icon">
            <i class="iconfont icon-shouye"></i>
          </div>
        </span>
        <p class="weui-tabbar__label">{{$t('home')}}</p>
      </router-link>
      <router-link to="/settings" class="weui-tabbar__item">
        <span style="display: inline-block;position: relative;">
          <div alt="" class="weui-tabbar__icon">
            <i class="iconfont icon-shezhi"></i>
          </div>
        </span>
        <p class="weui-tabbar__label">{{$t('settings')}}</p>
      </router-link>
      <router-link to="/change" class="weui-tabbar__item">
        <span style="display: inline-block;position: relative;">
          <div alt="" class="weui-tabbar__icon">
            <i class="iconfont icon-shijian"></i>
          </div>
          <span class="weui-badge" style="position: absolute;top: -2px;right: -13px;">1</span>
        </span>
        <p class="weui-tabbar__label">{{$t('changes')}}</p>
      </router-link>
      <router-link to="/about" class="weui-tabbar__item">
        <span style="display: inline-block;position: relative;">
          <div alt="" class="weui-tabbar__icon">
            <i class="iconfont icon-xinxi"></i>
          </div>
        </span>
        <p class="weui-tabbar__label">{{$t('about')}}</p>
      </router-link>
    </div>
  </div>
</template>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  padding-bottom: 10rem;
}
#nav {
  padding: 30px;
  a {
    font-weight: bold;
    color: #2c3e50;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
.weui-tabbar {
  position: fixed!important;
}
</style>
