/*
 * 启发式评价函数
 * 这个是专门给某一个位置打分的，不是给整个棋盘打分的
 * 并且是只给某一个角色打分
 */
import R from "./role.js"
import score from "./score.js"
/*
 * 表示在当前位置下一个棋子后的分数
 * 为了性能考虑，增加了一个dir参数，如果没有传入则默认计算所有四个方向，如果传入值，则只计算其中一个方向的值
 */

var s = function(b, px, py, role, dir) {
  var board = b.board
  var result = 0,
    radius = 8,
    empty = 0
  var count = 0, block = 0, secondCount = 0  //另一个方向的count

  var len = board.length

  function reset() {
    count = 1
    block = 0
    empty = -1
    secondCount = 0  //另一个方向的count
  }
  

  if (dir === undefined || dir === 0) {
    reset()

    // -

    for(var i=py+1;true;i++) {
      if(i>=len) {
        block ++
        break
      }
      var t = board[px][i]
      if(t === R.empty) {
        if(empty == -1 && i<len-1 && board[px][i+1] == role) {
          empty = count
          continue
        } else {
          break
        }
      }
      if(t === role) {
        count ++
        continue
      } else {
        block ++
        break
      }
    }


    for(var i=py-1;true;i--) {
      if(i<0) {
        block ++
        break
      }
      var t = board[px][i]
      if(t === R.empty) {
        if(empty == -1 && i>0 && board[px][i-1] == role) {
          empty = 0  //注意这里是0，因为是从右往左走的
          continue
        } else {
          break
        }
      }
      if(t === role) {
        secondCount ++
        empty !== -1 && empty ++  //注意这里，如果左边又多了己方棋子，那么empty的位置就变大了
        continue
      } else {
        block ++
        break
      }
    }

    count+= secondCount

    b.scoreCache[role][0][px][py] = countToScore(count, block, empty)
  }
  result += b.scoreCache[role][0][px][py]

  if (dir === undefined || dir === 1) {

    // |
    reset()

    for(var i=px+1;true;i++) {
      if(i>=len) {
        block ++
        break
      }
      var t = board[i][py]
      if(t === R.empty) {
        if(empty == -1 && i<len-1 && board[i+1][py] == role) {
          empty = count
          continue
        } else {
          break
        }
      }
      if(t === role) {
        count ++
        continue
      } else {
        block ++
        break
      }
    }

    for(var i=px-1;true;i--) {
      if(i<0) {
        block ++
        break
      }
      var t = board[i][py]
      if(t === R.empty) {
        if(empty == -1 && i>0 && board[i-1][py] == role) {
          empty = 0
          continue
        } else {
          break
        }
      }
      if(t === role) {
        secondCount++
        empty !== -1 && empty ++  //注意这里，如果左边又多了己方棋子，那么empty的位置就变大了
        continue
      } else {
        block ++
        break
      }
    }

    count += secondCount

    b.scoreCache[role][1][px][py] = countToScore(count, block, empty)
  } 
  result += b.scoreCache[role][1][px][py]


  // \
  if (dir === undefined || dir === 2) {
    reset()

    for(var i=1;true;i++) {
      var x = px+i, y = py+i
      if(x>=len || y>=len) {
        block ++
        break
      }
      var t = board[x][y]
      if(t === R.empty) {
        if(empty == -1 && (x<len-1 && y < len-1) && board[x+1][y+1] == role) {
          empty = count
          continue
        } else {
          break
        }
      }
      if(t === role) {
        count ++
        continue
      } else {
        block ++
        break
      }
    }

    for(var i=1;true;i++) {
      var x = px-i, y = py-i
      if(x<0||y<0) {
        block ++
        break
      }
      var t = board[x][y]
      if(t === R.empty) {
        if(empty == -1 && (x>0 && y>0) && board[x-1][y-1] == role) {
          empty = 0
          continue
        } else {
          break
        }
      }
      if(t === role) {
        secondCount ++
        empty !== -1 && empty ++  //注意这里，如果左边又多了己方棋子，那么empty的位置就变大了
        continue
      } else {
        block ++
        break
      }
    }

    count+= secondCount

    b.scoreCache[role][2][px][py] = countToScore(count, block, empty)
  }
  result += b.scoreCache[role][2][px][py]


  // /
  if (dir === undefined || dir === 3) {
    reset()

    for(var i=1; true;i++) {
      var x = px+i, y = py-i
      if(x<0||y<0||x>=len||y>=len) {
        block ++
        break
      }
      var t = board[x][y]
      if(t === R.empty) {
        if(empty == -1 && (x<len-1 && y<len-1) && board[x+1][y-1] == role) {
          empty = count
          continue
        } else {
          break
        }
      }
      if(t === role) {
        count ++
        continue
      } else {
        block ++
        break
      }
    }

    for(var i=1;true;i++) {
      var x = px-i, y = py+i
      if(x<0||y<0||x>=len||y>=len) {
        block ++
        break
      }
      var t = board[x][y]
      if(t === R.empty) {
        if(empty == -1 && (x>0 && y>0) && board[x-1][y+1] == role) {
          empty = 0
          continue
        } else {
          break
        }
      }
      if(t === role) {
        secondCount++
        empty !== -1 && empty ++  //注意这里，如果左边又多了己方棋子，那么empty的位置就变大了
        continue
      } else {
        block ++
        break
      }
    }

    count += secondCount

    b.scoreCache[role][3][px][py] = countToScore(count, block, empty)
  }
  result += b.scoreCache[role][3][px][py]

  return result
}


var countToScore = function(count, block, empty) {

  if(empty === undefined) empty = 0

  //没有空位
  if(empty <= 0) {
    if(count >= 5) return score.FIVE
    if(block === 0) {
      switch(count) {
        case 1: return score.ONE
        case 2: return score.TWO
        case 3: return score.THREE
        case 4: return score.FOUR
      }
    }

    if(block === 1) {
      switch(count) {
        case 1: return score.BLOCKED_ONE
        case 2: return score.BLOCKED_TWO
        case 3: return score.BLOCKED_THREE
        case 4: return score.BLOCKED_FOUR
      }
    }

  } else if(empty === 1 || empty == count-1) {
    //第1个是空位
    if(count >= 6) {
      return score.FIVE
    }
    if(block === 0) {
      switch(count) {
        case 2: return score.TWO/2
        case 3: return score.THREE
        case 4: return score.BLOCKED_FOUR
        case 5: return score.FOUR
      }
    }

    if(block === 1) {
      switch(count) {
        case 2: return score.BLOCKED_TWO
        case 3: return score.BLOCKED_THREE
        case 4: return score.BLOCKED_FOUR
        case 5: return score.BLOCKED_FOUR
      }
    }
  } else if(empty === 2 || empty == count-2) {
    //第二个是空位
    if(count >= 7) {
      return score.FIVE
    }
    if(block === 0) {
      switch(count) {
        case 3: return score.THREE
        case 4: 
        case 5: return score.BLOCKED_FOUR
        case 6: return score.FOUR
      }
    }

    if(block === 1) {
      switch(count) {
        case 3: return score.BLOCKED_THREE
        case 4: return score.BLOCKED_FOUR
        case 5: return score.BLOCKED_FOUR
        case 6: return score.FOUR
      }
    }

    if(block === 2) {
      switch(count) {
        case 4:
        case 5:
        case 6: return score.BLOCKED_FOUR
      }
    }
  } else if(empty === 3 || empty == count-3) {
    if(count >= 8) {
      return score.FIVE
    }
    if(block === 0) {
      switch(count) {
        case 4:
        case 5: return score.THREE
        case 6: return score.BLOCKED_FOUR
        case 7: return score.FOUR
      }
    }

    if(block === 1) {
      switch(count) {
        case 4:
        case 5:
        case 6: return score.BLOCKED_FOUR
        case 7: return score.FOUR
      }
    }

    if(block === 2) {
      switch(count) {
        case 4:
        case 5:
        case 6:
        case 7: return score.BLOCKED_FOUR
      }
    }
  } else if(empty === 4 || empty == count-4) {
    if(count >= 9) {
      return score.FIVE
    }
    if(block === 0) {
      switch(count) {
        case 5:
        case 6:
        case 7:
        case 8: return score.FOUR
      }
    }

    if(block === 1) {
      switch(count) {
        case 4:
        case 5:
        case 6:
        case 7: return score.BLOCKED_FOUR
        case 8: return score.FOUR
      }
    }

    if(block === 2) {
      switch(count) {
        case 5:
        case 6:
        case 7:
        case 8: return score.BLOCKED_FOUR
      }
    }
  } else if(empty === 5 || empty == count-5) {
    return score.FIVE
  }

  return 0
}

export default s
