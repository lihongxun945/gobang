<template>
  <div class="home">
    <h1>{{$t('title')}} {{version}}</h1>
    <Board @set="set"></Board>
    <div class="status">
      <div class="status-inner">{{statusText}}</div>
    </div>
    <div class="weui-flex operations">
      <div class="weui-flex__item">
        <a
          href="javascript:;"
          :class="'weui-btn weui-btn_primary ' + (status === 'READY' ? '' : 'weui-btn_disabled')"
          @click="showStartDialog">
          {{$t('start')}}
        </a>
      </div>
      <div class="weui-flex__item">
        <a
          href="javascript:;"
          :class="'weui-btn weui-btn_warn ' + (status === 'PLAYING' ? '' : 'weui-btn_disabled')"
          @click="showGiveDialog"
          >
          {{$t('give')}}
        </a>
      </div>
      <div class="weui-flex__item">
        <a
          href="javascript:;"
          @click="backward"
          :class="'weui-btn weui-btn_plain-primary ' + (canBackward() ? '' : 'weui-btn_plain-disabled')"
          ><i class="iconfont icon-xiangzuojiantou"></i></a>
      </div>
      <div class="weui-flex__item">
        <a
          href="javascript:;"
          :class="'weui-btn weui-btn_plain-primary ' + (canForward() ? '' : 'weui-btn_plain-disabled')"
          @click="forward"
          ><i class="iconfont icon-xiangyoujiantou"></i></a>
      </div>
    </div>
    <Dialog
      ref="offensive"
      :title="$t('dialog.chooseOffensiveTitle')"
      :body="$t('dialog.chooseOffensiveBody')"
      >
      <a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary" @click="start(2)">{{$t('dialog.me')}}</a>
      <a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary" @click="start(1)">{{$t('dialog.xuanxuan')}}</a>
    </Dialog>
    <Dialog
      ref="give"
      :title="$t('dialog.giveTitle')"
      :body="$t('dialog.giveBody')"
      >
      <a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_primary" @click="give">{{$t('dialog.ok')}}</a>
      <a href="javascript:;" class="weui-dialog__btn weui-dialog__btn_default" @click="$refs.give.close()">{{$t('dialog.cancel')}}</a>
    </Dialog>
    <big-text ref="big">{{bigText}}</big-text>
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
  padding: 0 2rem;
  max-width: 50rem;
  .weui-btn {
    margin: 5px;
    height: 46px;
  }
  .iconfont {
    font-size: 24px;
    line-height: 46px;
  }
}

.status {
  margin: 1rem;
  text-align: center;
}
.status-inner {
}
</style>
