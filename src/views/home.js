// @ is an alias to /src
import { mapState } from 'vuex'
import Board from '@/components/Board'
import Dialog from '@/components/Dialog'
import BigText from '@/components/BigText'

import {
  ADD_CHESSMAN,
  SET_STATUS,
  RESET_BOARD,
  FORWARD,
  BACKWARD,
  SET_FIRST,
  SET_FIVES
} from '@/store/mutations'
import SCORE from '@/ai/score.js'
import * as STATUS from '@/status.js'
import win from '@/ai/win.js'

export default {
  name: 'home',
  data () {
    return {
      bigText: '',
      score: 0,
      step: -1,
      startTime: + new Date()
    }
  },
  created () {
    this.worker = new Worker("./ai.bundle.js?r="+(+new Date()));
    this.worker.onmessage = e => {
      const d = e.data
      const score = this.score = d.score
      const position = [d[0], d[1]]
      const step = this.step = d.step
      this._set(position, 1)
      this.$store.dispatch(SET_STATUS, STATUS.PLAYING)

      if (score >= SCORE.FIVE/2 && step === 1) {
        this.$store.dispatch(SET_FIVES, win(this.board))
        this.$store.dispatch(SET_STATUS, STATUS.LOCKED)
        this.showBigText(this.$t('you lose'), this.end)
      } else if (score <= - SCORE.FIVE/2 && step === 1) {
        this.$store.dispatch(SET_FIVES, win(this.board))
        this.$store.dispatch(SET_STATUS, STATUS.LOCKED)
        this.showBigText(this.$t('you win'), this.end)
      }
    }
    this.$store.dispatch(SET_STATUS, STATUS.READY)
  },
  components: {
    Board,
    Dialog,
    BigText
  },
  computed: {
    statusText () {
      if (this.status === STATUS.LOADING) {
        return this.$t('status.loading')
      } else if (this.status === STATUS.READY) {
        return this.$t('status.start')
      } else if (this.status === STATUS.THINKING) {
        return this.$t('status.thinking')
      } else if (this.status === STATUS.PLAYING) {
        return this.$t('status.playing', {
          score: this.score,
          step: this.step,
          time: ((new Date() - this.startTime)/1000).toFixed(2)
        })
      } else return this.$t('status.loading')
    },
    ...mapState({
      board: state => state.board.board,
      steps: state => state.board.steps,
      stepsTail: state => state.board.stepsTail,
      status: state => state.home.status,
      deep: state => state.home.deep,
      spread: state => state.home.spread,
      version: 'version'
    })
  },
  watch: {
    deep () {
      this.updateConfig()
    },
    spread () {
      this.updateConfig()
    }
  },
  methods: {
    showStartDialog () {
      if (this.status !== STATUS.READY) return false
      this.$refs.offensive.open()
    },
    showGiveDialog () {
      if (this.status !== STATUS.PLAYING) return false
      this.$refs.give.open()
    },
    start (first) {
      this.$refs.offensive.close()
      this.$store.dispatch(SET_STATUS, STATUS.LOCKED)
      this.$store.dispatch(SET_FIRST, first)
      this.$store.dispatch(RESET_BOARD)
      this.showBigText('START!', () => {
        this.worker.postMessage({
          type: "START"
        });
        if (first === 1) {
          this.worker.postMessage({
            type: "BEGIN"
          });
        }
        this.$store.dispatch(SET_STATUS, STATUS.PLAYING)
      })
    },
    end () {
      this.$store.dispatch(SET_STATUS, STATUS.READY)
    },

    forward () {
      if (!this.canForward()) return false
      this.$store.dispatch(FORWARD)
      this.worker.postMessage({
        type: "FORWARD"
      });
    },

    backward() {
      if (!this.canBackward()) return false
      this.$store.dispatch(BACKWARD)
      this.worker.postMessage({
        type: "BACKWARD"
      });
    },
    give () {
      this.$store.dispatch(SET_STATUS, STATUS.LOCKED)
      this.$refs.give.close()
      this.showBigText(this.$t('you lose'), () => {
        this.end()
      })
    },

    showBigText (title, callback) {
      this.bigText = title
      this.$refs.big.open()
      setTimeout(() => {
        this.$refs.big.close()
      }, 2500)
      setTimeout(() => {
        callback && callback.call(this)
      }, 3000)
    },
    _set (position, role) {
      this.$store.dispatch(ADD_CHESSMAN, {
        position: position,
        role: role
      })
    },
   
    set (position) {
      if (this.status !== STATUS.PLAYING) return false
      const x = position[0]
      const y = position[1]
      if(this.board[x][y] !== 0) {
        throw new Error("NOT_EMPTY")
      }
      
      this._set(position, 2)

      this.worker.postMessage({
        type: "GO",
        x: x,
        y: y
      })
      this.$store.dispatch(SET_STATUS, STATUS.THINKING)
      this.startTime = + new Date()
    },

    canBackward () {
      return this.status === STATUS.PLAYING && this.steps.length >= 2
    },
    canForward () {
      return this.status === STATUS.PLAYING && this.stepsTail.length >= 2
    },
    updateConfig () {
      this.worker.postMessage({
        type: 'CONFIG',
        config: {
          searchDeep: this.deep,
          spread: this.spread
        }
      })
    }
  }
}
