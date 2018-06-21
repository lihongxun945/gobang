<template>
  <div class="hello">
    <h1>{{$t('title')}} {{version}}</h1>


    <div class="weui-flex operations">
      <div class="weui-flex__item"><a href="javascript:;" class="weui-btn weui-btn_primary">{{$t('start')}}</a></div>
      <div class="weui-flex__item"><a href="javascript:;" class="weui-btn weui-btn_warn">{{$t('give')}}</a></div>
      <div class="weui-flex__item"><a href="javascript:;" class="weui-btn weui-btn_plain-primary">{{$t('forward')}}</a></div>
      <div class="weui-flex__item"><a href="javascript:;" class="weui-btn weui-btn_plain-primary">{{$t('backward')}}</a></div>
    </div>

    <div class="weui-cells__title">{{$t('settings')}}</div>
    <div class="weui-cells">
      <div class="weui-cell weui-cell_select weui-cell_select-after">
        <div class="weui-cell__hd">
          <label for="" class="weui-label">{{$t('search deep')}}:</label>
        </div>
        <div class="weui-cell__bd">
          <select class="weui-select" name="deep" :value="deep" @change="setDeep">
            <option v-for="d in deepList" :key="d.value" :value="d.value">{{$t(d.title)}} ({{d.value}}~{{d.value+2}})</option>
          </select>
        </div>
      </div>
      <div class="weui-cell weui-cell_select weui-cell_select-after">
        <div class="weui-cell__hd">
          <label for="" class="weui-label">{{$t('lang')}}:</label>
        </div>
        <div class="weui-cell__bd">
          <select class="weui-select" name="lang" :value="lang" @change="setLang">
            <option value="en">English</option>
            <option value="zh">简体中文</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { SET_DEEP, SET_LANG } from '@/store/mutations.js'
import i18n from '../i18n/index.js'

export default {
  name: 'HelloWorld',
  components: {
  },
  computed: {
    ...mapState({
      version: 'version',
      lang: state => state.home.lang,
      deep: state => state.home.deep,
      deepList: state => state.home.deepList
    })
  },
  methods: {
    setDeep (e) {
      let value = e.target.value
      this.$store.dispatch(SET_DEEP, parseInt(value))
    },
    setLang (e) {
      let value = e.target.value
      this.$store.dispatch(SET_LANG, value)
      i18n.locale = value
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import '../variables';
h1 {
  font-size: 28px;
  color: $primary-color;
  text-align: center;
}

.operations {
  .weui-btn {
    margin: 5px;
    height: 46px;
  }
}
</style>
