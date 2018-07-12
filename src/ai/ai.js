import m from "./negamax.js"
import R from "./role.js"
import zobrist from "./zobrist.js"
import config from "./config.js"
import board from "./board.js"
import opening from './opening.js'
import open26 from './open26.js'

class AI {

  //初始化,开始游戏
  start (random) {
    if (random) {
      const names = []
      for (var k in open26) {
        names.push(k)
      }
      const n = names[parseInt(Math.random()*26)]
      const o = open26[n]
      board.init(open26[n])
      return {
        board: o,
        name: o.name
      }
    } else {
      board.init(15)
      return {
        board: undefined
      }
    }
  }

  //电脑下棋
  begin () {
    let p
    if (board.allSteps.length > 1) p = opening(board)
    p = p || m(undefined, config.searchDeep)
    board.put(p, R.com, true)
    return p
  }

  //下子并计算
  turn (x, y) {
    this.set(x, y, R.hum)
    return this.begin()
  }

  //只下子，不做计算
  set (x, y, r) {
    board.put([x,y], r, true)
  }

  //悔棋
  backward () {
    board.backward()
  }
  //悔棋
  forward () {
    board.forward()
  }
}
export default AI
