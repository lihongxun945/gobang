<template>
  <div class="home">
    <h1>{{$t('title')}} {{version}}</h1>
    <board @set="set"></board>
    <div class="status">
      <div class="status-inner">{{statusText}}</div>
    </div>
    <div class="weui-flex operations">
      <div class="weui-flex__item">
        <a
          href="javascript:;"
          :class="'weui-btn weui-btn_primary ' + (status === 'READY' ? '' : 'weui-btn_disabled')"
          @click="start">
          {{$t('start')}}
        </a>
      </div>
      <div class="weui-flex__item">
        <a
          href="javascript:;"
          :class="'weui-btn weui-btn_warn ' + (status === 'PLAYING' ? '' : 'weui-btn_disabled')"
          @click="give"
          >
          {{$t('give')}}
        </a>
      </div>
      <div class="weui-flex__item">
        <a
          href="javascript:;"
          :class="'weui-btn weui-btn_plain-primary ' + (canForward() ? '' : 'weui-btn_plain-disabled')"
          @click="forward"
          >{{$t('forward')}}</a>
      </div>
      <div class="weui-flex__item">
        <a
          href="javascript:;"
          @click="backward"
          :class="'weui-btn weui-btn_plain-primary ' + (canBackward() ? '' : 'weui-btn_plain-disabled')"
          >{{$t('backward')}}</a>
      </div>
    </div>
  </div>
</template>

<script>
import Home from './home.js'
export default Home
</script>

<style lang="scss" scoped>
@import '../variables.scss';
h1 {
  color: $primary-color;
  font-size: 2.2rem;
  text-align: center;
  margin: 1.5rem 0;
}

.operations {
  margin: 2rem auto;
  padding: 0 1rem;
  max-width: 50rem;
  .weui-btn {
    margin: 5px;
    height: 46px;
  }
}

.status {
  margin: 1rem;
  text-align: center;
}
.status-inner {
}
</style>
