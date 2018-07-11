<template>
  <transition name="fade">
    <div class="big-text" v-if="internalShow">
      <slot></slot>
    </div>
  </transition>
</template>

<script>
export default {
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
.big-text {
  font-size: 5rem;
  font-weight: bold;
  color: red;
  position: fixed;
  height: 5rem;
  width: 30rem;
  line-height: 5rem;
  top: 22rem;
  left: 50%;
  margin-left: -15rem;
  opacity: 1;
  transform: scale(1);
  transform-origin: center;
  text-align: center;
}

.fade-enter-active, .fade-leave-active {
  transition: all ease-in .5s;
}
.fade-enter {
  opacity: 0;
  transform: scale(5);
}
.fade-leave-to {
  opacity: 0;
  transform: scale(1.2);
}

</style>
