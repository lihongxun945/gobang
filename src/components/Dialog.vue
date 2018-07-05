<template>
  <transition name="fade">
    <div class="dialog" v-if="internalShow">
      <div class="weui-mask"></div>
      <div class="weui-dialog">
        <div class="weui-dialog__hd"><strong class="weui-dialog__title">{{title}}</strong></div>
        <div class="weui-dialog__bd">{{body}}</div>
        <div class="weui-dialog__ft">
          <slot></slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: 'title'
    },
    body: {
      type: String,
      default: 'Hello There'
    }
  },
  data () {
    return {
      internalShow: false
    }
  },
  methods: {
    open () {
      this.internalShow = true
    },
    close () {
      this.internalShow = false
    }
  }
}
</script>

<style lang="scss" scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
