<template>
  <div class="board">
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
            :class="'chessman ' + (c === 1 ? 'black' : 'white')"
            :style="{
              marginTop: (1.5 + rowIndex*6.5) + '%',
              marginLeft: (1.5 + cIndex*6.5) + '%',
              }">
          </div>
        </div>
      </div>
      <div
        v-if="showSteps"
        v-for="(s, index) in steps"
        :key="index"
        @click="clickChessman"
        :class="'step ' + (s.role === 1 ? 'black' : 'white')"
        :style="{
          marginTop: (1.5 + s.position[0]*6.5) + '%',
          marginLeft: (1.5 + s.position[1]*6.5) + '%',
          color: s.role == 1 ? 'white' : 'black'
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
      showSteps: state => state.home.showSteps
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
    }
  }
}
</script>

<style lang="scss">
.board {
  .board-inner {
    width: 35rem;
    height: 35rem;
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
    &.white {
      color: black;
    }
  }
}
</style>
