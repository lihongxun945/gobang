<template>
  <div class="home">
    <h1>{{$t('title')}} {{version}}</h1>
    <board @set="set"></board>
    <div class="weui-flex operations">
      <div class="weui-flex__item"><a href="javascript:;" class="weui-btn weui-btn_primary" @click="start">{{$t('start')}}</a></div>
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
import { ADD_CHESSMAN } from '@/store/mutations'
import SCORE from '@/ai/score.js'

export default {
  name: 'home',
  created () {
    this.worker = new Worker("./ai.bundle.js?r="+(+new Date()));
    var self = this
    this.worker.onmessage = function(e) {
      const d = e.data
      const score = d.score
      const position = [d[0], d[1]]
      const step = d.step
      self._set(position, 1)

      if (score >= SCORE.FIVE/2 && step === 1) {
        window.alert('Xuanxuan Win')
        self.end()
      }
    }
  },
  components: {
    Board
  },
  computed: {
    ...mapState({
      board: state => state.board.board,
      steps: state => state.board.steps,
      version: 'version'
    })
  },
  methods: {
    start () {
      this.worker.postMessage({
        type: "START"
      });
      this.worker.postMessage({
        type: "BEGIN"
      });
    },
    end () {
    },
    _set (position, role) {
      this.$store.dispatch(ADD_CHESSMAN, {
        position: position,
        role: role
      })
    },
   
    set (position) {
      const x = position[0]
      const y = position[1]
      if(this.board[x][y] !== 0) {
        throw new Error("此位置不为空")
      }
      
      this._set(position, 2)

      this.worker.postMessage({
        type: "GO",
        x: x,
        y: y
      })
    }
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
