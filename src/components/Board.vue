<template>
  <div :class="'board first-' + first ">
    <div
      @click="click"
      ref="board"
      class="board-inner">
      <div>
        <div v-for="(row, rowIndex) in board" :key="rowIndex">
          <div
            v-for="(c, cIndex) in row"
            v-if="!!c"
            :key="cIndex"
            @click="clickChessman"
            :class="'chessman ' + (c === 1 ? 'black ' : 'white ') + (isLast([rowIndex, cIndex]) ? ' last-step' : '') + (isFives([rowIndex, cIndex]) ? ' fives' : '')"
            :style="{
              marginTop: (1.5 + rowIndex*6.53) + '%',
              marginLeft: (1.5 + cIndex*6.53) + '%',
              }">
          </div>
        </div>
      </div>
      <div
        v-if="showSteps"
        v-for="(s, index) in steps"
        :key="index"
        @click="clickChessman"
        :class="'step ' + (s.role === 1 ? 'black' : 'white') + (isFives(s.position) ? ' fives' : '')"
        :style="{
          marginTop: (1.5 + s.position[0]*6.53) + '%',
          marginLeft: (1.5 + s.position[1]*6.53) + '%'
          }">
          {{index+1}}
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
export default {
  name: 'board',
  
  computed: {
    ...mapState({
      board: state => state.board.board,
      steps: state => state.board.steps,
      showSteps: state => state.home.showSteps,
      first: state => state.home.first,
      fives: state => state.board.fives
    })
  },
  methods: {
    click (e) {
      let y = e.offsetX,
          x = e.offsetY,
          width = this.$refs.board.clientWidth,
          offset = width*0.044,
          step = width*0.065;
      x = Math.floor((x+offset)/step) - 1
      y = Math.floor((y+offset)/step) - 1
      this.$emit('set', [x, y])
    },
    clickChessman (e) {
      e.preventDefault()
      e.stopPropagation()
    },
    isLast (p) {
      if (!this.steps.length) return false
      const last = this.steps[this.steps.length-1].position
      return last[0] === p[0] && last[1] === p[1]
    },
    isFives (p) {
      if (!this.fives.length) return false
      for (var i=0;i<this.fives.length;i++) {
        var f = this.fives[i]
        if (p[0] === f[0] && p[1] === f[1]) {
          console.log('is five:', p)
          return true
        }
      }
      return false
    }
  }
}
</script>

<style lang="scss" scoped>
.board-inner {
  width: 37rem;
  height: 37rem;
  margin: 0 auto;
  position: relative;
  background-image: url("../assets/board.jpg");
  background-size: 100%;
}
.chessman, .step {
  position: absolute;
  width: 2rem;
  height: 2rem;
  line-height: 2rem;
  text-align: center;
  border-radius: 50%;
  font-size: 1.2rem;
  user-select: none;
}
.chessman {
  top: 0;
  bottom: 0;
  background-color: black;

  &.white {
    background-color: white;
  }
}

.step {
  color: white;
  &.white {
    color: black;
  }
}

.first-2 {
  .chessman {
    background-color: white;
    &.white {
      background-color: black;
    }
  }
  .step {
    color: black;
    &.white {
      color: white;
    }
  }
}

.last-step {
  box-shadow: 0 0 0 .4rem rgba(255, 0, 0, 0.4);
  animation: pulse 1.2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.8);
  }
  70% {
    box-shadow: 0 0 0 .6rem rgba(255, 0, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 0, 0, 0);
  }
}

.fives {
  animation: flash .8s infinite;
  box-shadow: none;
}

@keyframes flash {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
