<template>
  <transition name="fade">
    <div class="popover" v-if="internalShow">
      <div class="weui-mask"></div>
      <div class="weui-dialog">
        <slot></slot>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  props: {
    time: {
      type: Number,
      default: 2500
    }
  },
  data () {
    return {
      internalShow: false
    }
  },
  methods: {
    open (callback) {
      this.internalShow = true
      setTimeout(() => {
        this.close()
        callback && callback()
      }, this.time)
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

.weui-dialog {
  background-color: transparent;
}
</style>
