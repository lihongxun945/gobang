import scorePoint from "./evaluate-point.js"
import zobrist from "./zobrist.js"
import R from "./role.js"
import S from "./score.js"
import config from "./config.js"
import array from "./arrary.js"
import statistic from './statistic.js'
import math from './math.js'

var count = 0
var total = 0

//冲四的分其实肯定比活三高，但是如果这样的话容易形成盲目冲四的问题，所以如果发现电脑有无意义的冲四，则将分数降低到和活三一样
//而对于冲四活三这种杀棋，则将分数提高。
var fixScore = function(type) {
  if(type < S.FOUR && type >= S.BLOCKED_FOUR) {

    if(type >= S.BLOCKED_FOUR && type < (S.BLOCKED_FOUR + S.THREE)) {
      //单独冲四，意义不大
      return S.THREE
    } else if(type >= S.BLOCKED_FOUR + S.THREE && type < S.BLOCKED_FOUR * 2) {
      return S.FOUR  //冲四活三，比双三分高，相当于自己形成活四
    } else {
      //双冲四 比活四分数也高
      return S.FOUR * 2
    }
  }
  return type
}

var starTo = function (point, points) {
  if (!points || !points.length) return false
  const a = point
  for (var i=0;i<points.length;i++) {
    // 距离必须在5步以内
    const b = points[i]
    if ((Math.abs(a[0]-b[0]) > 4 || Math.abs(a[1]-b[1]) > 4)) return false
    // 必须在米子方向上
    if ( !(a[0] === b[0] || a[1] === b[1] || (Math.abs(a[0]-b[0]) === Math.abs(a[1]-b[1]))) ) return false
  }
  return true
}

class Board {

  init (sizeOrBoard) {
    console.log('initboard')
    this.evaluateCache = {}
    this.currentSteps = [] // 当前一次思考的步骤
    this.allSteps = []
    this.stepsTail = []
    this.zobrist = zobrist
    zobrist.init() // 注意重新初始化
    this._last = [false, false] // 记录最后一步
    this.count = 0;// chessman count
    var size
    if(sizeOrBoard.length) {
      this.board = sizeOrBoard
      size = this.board.length
      for (var i=0;i<this.board.length;i++) this.count += this.board[i].filter(d=>d>0).length
    } else {
      size = sizeOrBoard
      this.board = []
      for(var i=0;i<size;i++) {
        var row = []
        for(var j=0;j<size;j++) {
          row.push(0)
        }
        this.board.push(row)
      }
    }
    statistic.init(size)


    // 存储双方得分
    this.comScore = array.create(size, size)
    this.humScore = array.create(size, size)

    // scoreCache[role][dir][row][column]
    this.scoreCache = [
      [], // placeholder
      [ // for role 1
        array.create(size, size),
        array.create(size, size),
        array.create(size, size),
        array.create(size, size)
      ],
      [ // for role 2
        array.create(size, size),
        array.create(size, size),
        array.create(size, size),
        array.create(size, size)
      ]
    ]

    this.initScore()
    
  }

  initScore () {

    var board = this.board

    for(var i=0;i<board.length;i++) {
      for(var j=0;j<board[i].length;j++) {
        // 空位，对双方都打分
        if(board[i][j] == R.empty) {
          if(this.hasNeighbor(i, j, 2, 2)) { //必须是有邻居的才行
            var cs = scorePoint(this, i, j, R.com)
            var hs = scorePoint(this, i, j, R.hum)
            this.comScore[i][j] = cs
            this.humScore[i][j] = hs
          }

        } else if (board[i][j] == R.com) { // 对电脑打分，玩家此位置分数为0
          this.comScore[i][j] = scorePoint(this, i, j, R.com)
          this.humScore[i][j] = 0
        } else if (board[i][j] == R.hum) { // 对玩家打分，电脑位置分数为0
          this.humScore[i][j] = scorePoint(this, i, j, R.hum)
          this.comScore[i][j] = 0
        }
      }
    }
  }

  //只更新一个点附近的分数
  // 参见 evaluate point 中的代码，为了优化性能，在更新分数的时候可以指定只更新某一个方向的分数
  updateScore (p) {
    var radius = 4,
        board = this.board,
        self = this,
        len = this.board.length

    function update(x, y, dir) {
      var role = self.board[x][y]
      if (role !== R.reverse(R.com)) {
        var cs = scorePoint(self, x, y, R.com, dir)
        self.comScore[x][y] = cs
        statistic.table[x][y] += cs
      } else self.comScore[x][y] = 0
      if (role !== R.reverse(R.hum)) {
        var hs = scorePoint(self, x, y, R.hum, dir)
        self.humScore[x][y] = hs
        statistic.table[x][y] += hs
      } else self.humScore[x][y] = 0

    }
    // 无论是不是空位 都需要更新
    // -
    for(var i=-radius;i<=radius;i++) {
      var x = p[0], y = p[1]+i
      if(y<0) continue
      if(y>=len) break
      update(x, y, 0)
    }

    // |
    for(var i=-radius;i<=radius;i++) {
      var x = p[0]+i, y = p[1]
      if(x<0) continue
      if(x>=len) break
      update(x, y, 1)
    }

    // \
    for(var i=-radius;i<=radius;i++) {
      var x = p[0]+i, y = p[1]+i
      if(x<0 || y<0) continue
      if(x>=len || y>=len) break
      update(x, y, 2)
    }

    // /
    for(var i=-radius;i<=radius;i++) {
      var x = p[0]+i, y = p[1]-i
      if(x<0 || y<0) continue
      if(x>=len || y>=len) continue
      update(x, y, 3)
    }


  }

  //下子
  put (p, role) {
    p.role = role
    config.debug && console.log('put [' + p + ']' + ' ' + role)
    this.board[p[0]][p[1]] = role
    this.zobrist.go(p[0], p[1], role)
    this.updateScore(p)
    this.allSteps.push(p)
    this.currentSteps.push(p)
    this.stepsTail = []
    this.count ++
  }

  //移除棋子
  remove (p) {
    var r = this.board[p[0]][p[1]]
    config.debug && console.log('remove [' + p + ']' + ' ' + r)
    this.zobrist.go(p[0], p[1], r)
    this.board[p[0]][p[1]] = R.empty
    this.updateScore(p)
    this.allSteps.pop()
    this.currentSteps.pop()
    this.count --
  }

  //悔棋
  backward () {
    if(this.allSteps.length < 2) return
    var i =0;
    while(i<2) {
      var s = this.allSteps[this.allSteps.length-1]
      this.remove(s)
      this.stepsTail.push(s)
      i++
    }
  }

  //前进
  forward () {
    if(this.stepsTail.length < 2) return
    var i =0;
    while(i<2) {
      var s = this.stepsTail.pop()
      this.put(s, s.role)
      i++
    }
  }


  logSteps () {
    console.log("steps:" + this.allSteps.map((d) => '['+d[0]+','+d[1]+']').join(','))
  }

  //棋面估分
  //这里只算当前分，而不是在空位下一步之后的分
  evaluate (role) {

    //这里加了缓存，但是并没有提升速度
    // if(config.cache && this.evaluateCache[this.zobrist.code]) return this.evaluateCache[this.zobrist.code]

    // 这里都是用正整数初始化的，所以初始值是0
    this.comMaxScore = 0
    this.humMaxScore = 0

    var board = this.board

    //遍历出最高分，开销不大
    for(var i=0;i<board.length;i++) {
      for(var j=0;j<board[i].length;j++) {
        if(board[i][j] == R.com) {
          this.comMaxScore += fixScore(this.comScore[i][j])
        } else if (board[i][j] == R.hum) {
          this.humMaxScore += fixScore(this.humScore[i][j])
        }
      }
    }
    // 有冲四延伸了，不需要专门处理冲四活三
    // 不过这里做了这一步，可以减少电脑胡乱冲四的毛病
    //this.comMaxScore = fixScore(this.comMaxScore)
    //this.humMaxScore = fixScore(this.humMaxScore)
    var result = (role == R.com ? 1 : -1) * (this.comMaxScore - this.humMaxScore)
    // if (config.cache) this.evaluateCache[this.zobrist.code] = result

    return result

  }

  //启发函数
  /*
   * 变量starBread的用途是用来进行米子计算
   * 所谓米子计算，只是，如果第一步尝试了一个位置A，那么接下来尝试的位置有两种情况：
   * 1: 大于等于活三的位置
   * 2: 在A的米子位置上
   * 注意只有对小于活三的棋才进行starSpread优化
   */

  /*
   * gen 函数的排序是非常重要的，因为好的排序能极大提升AB剪枝的效率。
   * 而对结果的排序，是要根据role来的
   */


  log () {
    config.log&&console.log('star: ' + (count/total*100).toFixed(2) + '%, ' + count + '/' + total)
  }
  gen (role, onlyThrees, starSpread) {
    if (this.count <= 0) return [7, 7]
    var fives = []
    var comfours=[]
    var humfours=[]
    var comblockedfours = []
    var humblockedfours = []
    var comtwothrees=[]
    var humtwothrees=[]
    var comthrees = []
    var humthrees = []
    var comtwos = []
    var humtwos = []
    var neighbors = []

    var board = this.board
    var reverseRole = R.reverse(role)
    // 找到双方的最后进攻点
    const attackPoints = [] // 进攻点
    const defendPoints = [] // 防守点


    // 默认情况下 我们遍历整个棋盘。但是在开启star模式下，我们遍历的范围就会小很多
    // 只需要遍历以两个点为中心正方形。
    // 注意除非专门处理重叠区域，否则不要把两个正方形分开算，因为一般情况下这两个正方形会有相当大的重叠面积，别重复计算了
    if (starSpread && config.star) {

      var i = this.currentSteps.length - 1
      while(i >= 0) {
        var p = this.currentSteps[i]
        if (reverseRole === R.com && p.scoreCom >= S.THREE
          || reverseRole === R.hum && p.scoreHum >= S.THREE) {
          defendPoints.push(p)
          break
        }
        i -= 2
      }

      var i = this.currentSteps.length - 2
      while(i >= 0) {
        var p = this.currentSteps[i]
        if (role === R.com && p.scoreCom >= S.THREE
          || role === R.hum && p.scoreHum >= S.THREE) {
          attackPoints.push(p)
          break;
        }
        i -= 2
      }

      if (!attackPoints.length) attackPoints.push(this.currentSteps[0].role === role ? this.currentSteps[0] : this.currentSteps[1])
      if (!defendPoints.length) defendPoints.push(this.currentSteps[0].role === reverseRole? this.currentSteps[0] : this.currentSteps[1])
    }

    for(var i=0;i<board.length;i++) {
      for(var j=0;j<board.length;j++) {
        if(board[i][j] == R.empty) {

          if(this.allSteps.length < 6) {
            if( !this.hasNeighbor(i, j, 1, 1)) continue
          } else if (!this.hasNeighbor(i, j, 2, 2)) continue

          var scoreHum = this.humScore[i][j]
          var scoreCom = this.comScore[i][j]
          var maxScore = Math.max(scoreCom, scoreHum)

          if (onlyThrees && maxScore < S.THREE) continue

          var p = [i, j]
          p.scoreHum = scoreHum
          p.scoreCom = scoreCom
          p.score = maxScore
          p.role = role

          total ++
          /* 双星延伸，以提升性能
           * 思路：每次下的子，只可能是自己进攻，或者防守对面（也就是对面进攻点）
           * 我们假定任何时候，绝大多数情况下进攻的路线都可以按次序连城一条折线，那么每次每一个子，一定都是在上一个己方棋子的八个方向之一。
           * 因为既可能自己进攻，也可能防守对面，所以是最后两个子的米子方向上
           * 那么极少数情况，进攻路线无法连成一条折线呢?很简单，我们对前双方两步不作star限制就好，这样可以 兼容一条折线中间伸出一段的情况
           */
          if (starSpread && config.star) {
            var roleScore = role === R.com ? p.scoreCom : p.scoreHum
            var deRoleScore = role === R.com ? p.scoreHum: p.scoreCom

            if (maxScore >= S.FOUR) {
            } else if (maxScore >= S.BLOCKED_FOUR && starTo(this.currentSteps[this.currentSteps.length-1]) ) {
              //star 路径不是很准，所以考虑冲四防守对手最后一步的棋
            } else if (
              starTo(p, attackPoints) || starTo(p, defendPoints) 
            ) {
            } else {
              count ++
              continue
            }
          }

          if(scoreCom >= S.FIVE) {//先看电脑能不能连成5
            fives.push(p)
          } else if(scoreHum >= S.FIVE) {//再看玩家能不能连成5
            //别急着返回，因为遍历还没完成，说不定电脑自己能成五。
            fives.push(p)
          } else if(scoreCom >= S.FOUR) {
            comfours.push(p)
          } else if(scoreHum >= S.FOUR) {
            humfours.push(p)
          } else if(scoreCom >= S.BLOCKED_FOUR) {
            comblockedfours.push(p)
          } else if(scoreHum >= S.BLOCKED_FOUR) {
            humblockedfours.push(p)
          } else if(scoreCom >= 2*S.THREE) {
            //能成双三也行
            comtwothrees.push(p)
          } else if(scoreHum >= 2*S.THREE) {
            humtwothrees.push(p)
          } else if(scoreCom >= S.THREE) {
            comthrees.push(p)
          } else if(scoreHum >= S.THREE) {
            humthrees.push(p)
          } else if(scoreCom >= S.TWO) {
            comtwos.unshift(p)
          } else if(scoreHum >= S.TWO) {
            humtwos.unshift(p)
          } else neighbors.push(p)
        }
      }
    }

    //如果成五，是必杀棋，直接返回
    if(fives.length) return fives
    
    // 自己能活四，则直接活四，不考虑冲四
    if (role === R.com && comfours.length) return comfours
    if (role === R.hum && humfours.length) return humfours

    // 对面有活四冲四，自己冲四都没，则只考虑对面活四 （此时对面冲四就不用考虑了)
    
    if (role === R.com && humfours.length && !comblockedfours.length) return humfours
    if (role === R.hum && comfours.length && !humblockedfours.length) return comfours

    // 对面有活四自己有冲四，则都考虑下
    var fours = role === R.com ? comfours.concat(humfours) : humfours.concat(comfours)
    var blockedfours = role === R.com ? comblockedfours.concat(humblockedfours) : humblockedfours.concat(comblockedfours)
    if (fours.length) return fours.concat(blockedfours)

    var result = []
    if (role === R.com) {
      result = 
        comtwothrees
        .concat(humtwothrees)
        .concat(comblockedfours)
        .concat(humblockedfours)
        .concat(comthrees)
        .concat(humthrees)
    }
    if (role === R.hum) {
      result = 
        humtwothrees
        .concat(comtwothrees)
        .concat(humblockedfours)
        .concat(comblockedfours)
        .concat(humthrees)
        .concat(comthrees)
    }

    // result.sort(function(a, b) { return b.score - a.score })

    //双三很特殊，因为能形成双三的不一定比一个活三强
    if(comtwothrees.length || humtwothrees.length) {
      return result
    }


    // 只返回大于等于活三的棋
    if (onlyThrees) {
      return result
    }


    var twos
    if (role === R.com) twos = comtwos.concat(humtwos)
    else twos = humtwos.concat(comtwos)

    twos.sort(function(a, b) { return b.score - a.score })
    result = result.concat(twos.length ? twos : neighbors)

    //这种分数低的，就不用全部计算了
    if(result.length>config.countLimit) {
      return result.slice(0, config.countLimit)
    }

    return result
  }

  hasNeighbor (x, y, distance, count) {
    var board = this.board
    var len = board.length
    var startX = x-distance
    var endX = x+distance
    var startY = y-distance
    var endY = y+distance
    for(var i=startX;i<=endX;i++) {
      if(i<0||i>=len) continue
      for(var j=startY;j<=endY;j++) {
        if(j<0||j>=len) continue
        if(i==x && j==y) continue
        if(board[i][j] != R.empty) {
          count --
          if(count <= 0) return true
        }
      }
    }
    return false
  }

  toString () {
    return this.board.map(function (d) { return d.join(',') }).join('\n')
  }
}

var board = new Board()

export default board
