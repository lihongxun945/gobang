<template>
  <div class="home">
    <h1>{{$t('title')}} {{version}}</h1>
    <board></board>
    <div class="weui-flex operations">
      <div class="weui-flex__item"><a href="javascript:;" class="weui-btn weui-btn_primary">{{$t('start')}}</a></div>
      <div class="weui-flex__item"><a href="javascript:;" class="weui-btn weui-btn_warn">{{$t('give')}}</a></div>
      <div class="weui-flex__item"><a href="javascript:;" class="weui-btn weui-btn_plain-primary">{{$t('forward')}}</a></div>
      <div class="weui-flex__item"><a href="javascript:;" class="weui-btn weui-btn_plain-primary">{{$t('backward')}}</a></div>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import { mapState } from 'vuex'
import Board from '@/components/Board'

export default {
  name: 'home',
  components: {
    Board
  },
  computed: {
    ...mapState({
      version: 'version'
    })
  }
}
</script>

<style lang="scss">
@import '../variables.scss';
h1 {
  color: $primary-color;
  font-size: 2.2rem;
  text-align: center;
  margin: 1.5rem 0;
}

.operations {
  margin: 2rem auto;
  max-width: 50rem;
  .weui-btn {
    margin: 5px;
    height: 46px;
  }
}
</style>
