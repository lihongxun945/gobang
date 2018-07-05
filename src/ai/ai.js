import m from "./negamax.js"
import R from "./role.js"
import zobrist from "./zobrist.js"
import config from "./config.js"
import board from "./board.js"
import opening from './opening.js'

class AI {

  //初始化,开始游戏
  start (size) {
    board.init(size)
  }


  //电脑下棋
  begin () {
    if(board.steps.length === 0) {
      this.set(7, 7, R.com)
      return [7, 7]
    }
    var p
    if (config.opening) {
      p = opening(board)
    }
    p = p || m(config.searchDeep)
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
