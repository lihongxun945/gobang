(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * 棋型表示
 * 用一个6位数表示棋型，从高位到低位分别表示
 * 连五，活四，眠四，活三，活二/眠三，活一/眠二, 眠一
 */

module.exports = {
  ONE: 10,
  TWO: 100,
  THREE: 1000,
  FOUR: 100000,
  FIVE: 1000000,
  BLOCKED_ONE: 1,
  BLOCKED_TWO: 10,
  BLOCKED_THREE: 100,
  BLOCKED_FOUR: 10000
}

},{}],2:[function(require,module,exports){
var m = require("./negamax.js");
var R = require("./role.js");
var zobrist = require("./zobrist.js");
var config = require("./config.js");
var board = require("./board.js");

var AI = function() {
}


//初始化,开始游戏
AI.prototype.start = function(size) {
  board.init(size);
}


//电脑下棋
AI.prototype.begin = function() {
  if(board.steps.length === 0) {
    this.set(7, 7, R.com);
    return [7, 7];
  }
  var p = m(config.searchDeep);
  board.put(p, R.com, true);
  return p;
}

//下子并计算
AI.prototype.turn = function(x, y) {
  this.set(x, y, R.hum);
  return this.begin();
}

//只下子，不做计算
AI.prototype.set = function(x, y, r) {
  board.put([x,y], r, true);
}

//悔棋
AI.prototype.back = function() {
  board.back();
}
module.exports = AI;

},{"./board.js":3,"./config.js":5,"./negamax.js":9,"./role.js":11,"./zobrist.js":13}],3:[function(require,module,exports){
var scorePoint = require("./evaluate-point.js");
var zobrist = require("./zobrist.js");
var R = require("./role.js");
var S = require("./score.js");
var config = require("./config.js");

var Board = function() {
}

Board.prototype.init = function(sizeOrBoard) {
  this.evaluateCache = {};
  this.steps = [];
  this.zobrist = zobrist;
  var size;
  if(sizeOrBoard.length) {
    this.board = sizeOrBoard;
    size = this.board.length;
  } else {
    size = sizeOrBoard;
    this.board = [];
    for(var i=0;i<size;i++) {
      var row = [];
      for(var j=0;j<size;j++) {
        row.push(0);
      }
      this.board.push(row);
    }
  }


  this.comScore = [];
  this.humScore = [];

  for(var i=0;i<size;i++) {
    var row1 = [], row2=[];
    for(var j=0;j<size;j++) {
      row1.push(0);
      row2.push(0);
    }
    this.comScore.push(row1);
    this.humScore.push(row2);
  }

  this.initScore();
  
}

Board.prototype.initScore = function() {

  var board = this.board;

  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == R.empty) {
        if(this.hasNeighbor([i, j], 2, 2)) { //必须是有邻居的才行
          var cs = scorePoint(board, [i, j], R.com);
          var hs = scorePoint(board, [i, j], R.hum);
          this.comScore[i][j] = cs;
          this.humScore[i][j] = hs;
        }
      }
    }
  }
}

//只更新一个点附近的分数
Board.prototype.updateScore = function(p) {
  var radius = 8,
      board = this.board,
      self = this,
      len = this.board.length;

  function update(x, y) {
    var cs = scorePoint(board, [x, y], R.com);
    var hs = scorePoint(board, [x, y], R.hum);
    self.comScore[x][y] = cs;
    self.humScore[x][y] = hs;
    //注意下面这样写是错的！因为很可能最高分已经没了，不是总是取最高分的，这样分数会越来越高的。所以改成每次遍历计算
    /*self.comMaxScore = Math.max(cs, self.comMaxScore);
    self.humMaxScore = Math.max(hs, self.humMaxScore);*/
  }
  // -
  for(var i=-radius;i<radius;i++) {
    var x = p[0], y = p[1]+i;
    if(y<0) continue;
    if(y>=len) break;
    if(board[x][y] !== R.empty) continue;
    update(x, y);
  }

  // |
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1];
    if(x<0) continue;
    if(x>=len) break;
    if(board[x][y] !== R.empty) continue;
    update(x, y);
  }

  // \
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1]+i;
    if(x<0 || y<0) continue;
    if(x>=len || y>=len) break;
    if(board[x][y] !== R.empty) continue;
    update(x, y);
  }

  // /
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1]-i;
    if(x<0 || y<0) continue;
    if(x>=len || y>=len) continue;
    if(board[x][y] !== R.empty) continue;
    update(x, y);
  }


  //通过遍历来计算最高分
}

//下子
Board.prototype.put = function(p, role, record) {
  this.board[p[0]][p[1]] = role;
  this.zobrist.go(p[0], p[1], role);
  this.updateScore(p);
  if(record) this.steps.push(p);
}

//移除棋子
Board.prototype.remove = function(p) {
  var r = this.board[p[0]][p[1]];
  this.zobrist.go(p[0], p[1], r);
  this.board[p[0]][p[1]] = R.empty;
  this.updateScore(p);
}

//悔棋
Board.prototype.back = function() {
  if(this.steps.length < 2) return;
  var s = this.steps.pop();
  this.zobrist.go(s[0], s[1], this.board[s[0]][s[1]]);
  this.board[s[0]][s[1]] = R.empty;
  this.updateScore(s);
  var s = this.steps.pop();
  this.zobrist.go(s[0], s[1], this.board[s[0]][s[1]]);
  this.board[s[0]][s[1]] = R.empty;
  this.updateScore(s);
}

//棋面估分
Board.prototype.evaluate = function(role) {

  //这里加了缓存，但是并没有提升速度
  if(this.evaluateCache[this.zobrist.code]) return this.evaluateCache[this.zobrist.code];

  this.comMaxScore = - S.FIVE;
  this.humMaxScore = - S.FIVE;

  var board = this.board;

  //遍历出最高分，开销不大
  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == R.empty) {
        this.comMaxScore = Math.max(this.comScore[i][j], this.comMaxScore);
        this.humMaxScore = Math.max(this.humScore[i][j], this.humMaxScore);
      }
    }
  }
  var result = (role == R.com ? 1 : -1) * (this.comMaxScore - this.humMaxScore);
  this.evaluateCache[this.zobrist.code] = result;

  return result;

}

//启发函数
Board.prototype.gen = function() {
  var fives = [];
  var fours=[];
  var blockedfours = [];
  var twothrees=[];
  var threes = [];
  var twos = [];
  var neighbors = [];

  var board = this.board;

  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == R.empty) {
        if(this.hasNeighbor([i, j], 2, 2)) { //必须是有邻居的才行
          var scoreHum = this.humScore[i][j];
          var scoreCom = this.comScore[i][j];

          if(scoreCom >= S.FIVE) {//先看电脑能不能连成5
            return [[i, j]];
          } else if(scoreHum >= S.FIVE) {//再看玩家能不能连成5
            //别急着返回，因为遍历还没完成，说不定电脑自己能成五。
            fives.push([i, j]);
          } else if(scoreCom >= S.FOUR) {
            fours.unshift([i,j]);
          } else if(scoreHum >= S.FOUR) {
            fours.push([i,j]);
          } else if(scoreCom >= S.BLOCKED_FOUR) {
            blockedfours.unshift([i,j]);
          } else if(scoreHum >= S.BLOCKED_FOUR) {
            blockedfours.push([i,j]);
          } else if(scoreCom >= 2*S.THREE) {
            //能成双三也行
            twothrees.unshift([i,j]);
          } else if(scoreHum >= 2*S.THREE) {
            twothrees.push([i,j]);
          } else if(scoreCom >= S.THREE) {
            threes.unshift([i, j]);
          } else if(scoreHum >= S.THREE) {
            threes.push([i, j]);
          } else if(scoreCom >= S.TWO) {
            twos.unshift([i, j]);
          } else if(scoreHum >= S.TWO) {
            twos.push([i, j]);
          } else {
            neighbors.push([i, j]);
          }
        }
      }
    }
  }

  //如果成五，是必杀棋，直接返回
  if(fives.length) return [fives[0]];
  
  //注意一个活三可以有两个位置形成活四，但是不能只考虑其中一个，要从多个中考虑更好的选择
  //所以不能碰到活四就返回第一个，应该需要考虑多个
  if(fours.length) return fours;

  //冲四活三
  if(blockedfours.length) return [blockedfours[0]];

  //双三很特殊，因为能形成双三的不一定比一个活三强
  if(twothrees.length) {
    return twothrees.concat(threes);
  }

  var result = threes.concat(
      twos.concat(
        neighbors
      )
    );

  if(result.length>config.countLimit) {
    return result.slice(0, config.countLimit);
  }

  return result;
}

Board.prototype.hasNeighbor = function(point, distance, count) {
  var board = this.board;
  var len = board.length;
  var startX = point[0]-distance;
  var endX = point[0]+distance;
  var startY = point[1]-distance;
  var endY = point[1]+distance;
  for(var i=startX;i<=endX;i++) {
    if(i<0||i>=len) continue;
    for(var j=startY;j<=endY;j++) {
      if(j<0||j>=len) continue;
      if(i==point[0] && j==point[1]) continue;
      if(board[i][j] != R.empty) {
        count --;
        if(count <= 0) return true;
      }
    }
  }
  return false;
}

Board.prototype.win = function() {
  var board = this.board;
  var isFive = function(p, role) {
    var len = board.length;
    var count = 1;

    var reset = function() {
      count = 1;
    }

    for(var i=p[1]+1;true;i++) {
      if(i>=len) break;
      var t = board[p[0]][i];
      if(t !== role) break;
      count ++;
    }


    for(var i=p[1]-1;true;i--) {
      if(i<0) break;
      var t = board[p[0]][i];
      if(t !== role) break;
      count ++;
    }

    if(count >= 5) return true;

    //纵向
    reset();

    for(var i=p[0]+1;true;i++) {
      if(i>=len) {
        break;
      }
      var t = board[i][p[1]];
      if(t !== role) break;
      count ++;
    }

    for(var i=p[0]-1;true;i--) {
      if(i<0) {
        break;
      }
      var t = board[i][p[1]];
      if(t !== role) break;
      count ++;
    }


    if(count >= 5) return true;
    // \\
    reset();

    for(var i=1;true;i++) {
      var x = p[0]+i, y = p[1]+i;
      if(x>=len || y>=len) {
        break;
      }
      var t = board[x][y];
      if(t !== role) break;

      count ++;
    }

    for(var i=1;true;i++) {
      var x = p[0]-i, y = p[1]-i;
      if(x<0||y<0) {
        break;
      }
      var t = board[x][y];
      if(t !== role) break;
      count ++;
    }

    if(count >= 5) return true;

    // \/
    reset();

    for(var i=1; true;i++) {
      var x = p[0]+i, y = p[1]-i;
      if(x<0||y<0||x>=len||y>=len) {
        break;
      }
      var t = board[x][y];
      if(t !== role) break;
      count ++;
    }

    for(var i=1;true;i++) {
      var x = p[0]-i, y = p[1]+i;
      if(x<0||y<0||x>=len||y>=len) {
        break;
      }
      var t = board[x][y];
      if(t !== role) break;
      count ++;
    }

    if(count >= 5) return true;

    return false;
  }


  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      var t = board[i][j];
      if(t !== R.empty) {
        var r = isFive([i, j], t);
        if(r) return t;
      }
    }
  }
  return false;
}

var board = new Board();

module.exports = board;

},{"./config.js":5,"./evaluate-point.js":7,"./role.js":11,"./score.js":12,"./zobrist.js":13}],4:[function(require,module,exports){
/*
 * 算杀
 * 算杀的原理和极大极小值搜索是一样的
 * 不过算杀只考虑冲四活三这类对方必须防守的棋
 * 因此算杀的复杂度虽然是 M^N ，但是底数M特别小，可以算到16步以上的杀棋。
 */

/*
 * 基本思路
 * 电脑有活三或者冲四，认为是玩家必须防守的
 * 玩家防守的时候却不一定根据电脑的棋来走，而是选择走自己最好的棋，比如有可能是自己选择冲四
 */

var R = require("./role.js");
var scorePoint = require("./evaluate-point.js");
var S = require("./SCORE.js");
var config = require("./config.js");
var zobrist = require("./zobrist.js");
var debug = require("./debug.js");
var board = require("./board.js");

var Cache = {};

var debugNodeCount = 0;

var MAX_SCORE = S.THREE;
var MIN_SCORE = S.FOUR;

var debugCheckmate = debug.checkmate = {
  cacheCount: 0,
  cacheGet: 0
}


//找到所有比目标分数大的位置
var findMax = function(role, score) {
  var result = [];
  for(var i=0;i<board.board.length;i++) {
    for(var j=0;j<board.board[i].length;j++) {
      if(board.board[i][j] == R.empty) {
        var p = [i, j];
        if(board.hasNeighbor(p, 2, 1)) { //必须是有邻居的才行

          var s = (role == R.com ? board.comScore[p[0]][p[1]] : board.humScore[p[0]][p[1]]);
          p.score = s;
          if(s >= S.FIVE) {
            return [p];
          }
          if(s >= score) {
            result.push(p);
          }
        }
      }
    }
  }
  //注意对结果进行排序
  result.sort(function(a, b) {
    return b.score - a.score;
  });
  return result;
}


//找到所有比目标分数大的位置
var findMin = function(role, score) {
  var result = [];
  var fives = [];
  var fours = [];
  for(var i=0;i<board.board.length;i++) {
    for(var j=0;j<board.board[i].length;j++) {
      if(board.board[i][j] == R.empty) {
        var p = [i, j];
        if(board.hasNeighbor(p, 2, 1)) { //必须是有邻居的才行

          var s1 = (role == R.com ? board.comScore[p[0]][p[1]] : board.humScore[p[0]][p[1]]);
          var s2 = (role == R.com ? board.humScore[p[0]][p[1]] : board.comScore[p[0]][p[1]]);
          if(s1 >= S.FIVE) {
            p.score = - s1;
            return [p];
          } 
          if(s1 >= S.FOUR) {
            p.score = -s1;
            fours.unshift(p);
            continue;
          }
          if(s2 >= S.FIVE) {
            p.score = s2;
            fives.push(p);
            continue;
          } 
          if(s2 >= S.FOUR) {
            p.score = s2;
            fours.push(p);
            continue;
          }

          if(s1 >= score || s2 >= score) {
            p = [i, j];
            p.score = s1;
            result.push(p);
          }
        }
      }
    }
  }
  if(fives.length) return [fives[0]];
  if(fours.length) return [fours[0]];
  //注意对结果进行排序
  result.sort(function(a, b) {
    return Math.abs(b.score) - Math.abs(a.score);
  });
  return result;
}

var max = function(role, deep) {
  debugNodeCount ++;
  if(deep <= 0) return false;

  if(config.cache) {
    var c = Cache[zobrist.code];
    if(c) {
      if(c.deep >= deep || c.result !== false) {
        debugCheckmate.cacheGet ++;
        return c.result;
      }
    }
  }

  var points = findMax(role, MAX_SCORE);
  if(points.length && points[0].score >= S.FOUR) return [points[0]]; //为了减少一层搜索，活四就行了。
  if(points.length == 0) return false;
  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board.put(p, role);
    var m = min(role, deep-1);
    board.remove(p);
    if(m) {
      if(m.length) {
        m.unshift(p); //注意 unshift 方法返回的是新数组长度，而不是新数组本身
        cache(deep, m);
        return m;
      } else {
        cache(deep, [p]);
        return [p];
      }
    }
  }
  cache(deep, false);
  return false;
}


//只要有一种方式能防守住，就可以了
var min = function(role, deep) {
  debugNodeCount ++;
  var w = board.win();
  if(w == role) return true;
  if(w == R.reverse(role)) return false;
  if(deep <= 0) return false;
  if(config.cache) {
    var c = Cache[zobrist.code];
    if(c){
      if(c.deep >= deep || c.result !== false) {
        debugCheckmate.cacheGet ++;
        return c.result;
      }
    }
  }
  var points = findMin(R.reverse(role), MIN_SCORE);
  if(points.length == 0) return false;
  if(points.length && -1 * points[0].score  >= S.FOUR) return false; //为了减少一层搜索，活四就行了。

  var cands = [];
  var currentRole = R.reverse(role);
  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board.put(p, currentRole);
    var m = max(role, deep-1);
    board.remove(p);
    if(m) {
      m.unshift(p);
      cands.push(m);
      cache(deep, m);
      continue;
    } else {
      cache(deep, false);
      return false; //只要有一种能防守住
    }
  }
  var result = cands[Math.floor(cands.length*Math.random())];  //无法防守住
  cache(deep, result);
  return result;
}

var cache = function(deep, result) {
  if(!config.cache) return;
  Cache[zobrist.code] = {
    deep: deep,
    result: result
  }
  debugCheckmate.cacheCount ++;
}

//迭代加深
var deeping = function(role, deep) {
  var start = new Date();
  debugNodeCount = 0;
  for(var i=1;i<=deep;i++) {
    var result = max(role, i);
    if(result) break; //找到一个就行
  }
  var time = Math.round(new Date() - start);
  if(result) console.log("算杀成功("+time+"毫秒, "+ debugNodeCount + "个节点):" + JSON.stringify(result));
  else {
    //console.log("算杀失败("+time+"毫秒)");
  }
  return result;
}

module.exports = function(role, deep, onlyFour) {

  deep = deep || config.checkmateDeep;
  if(deep <= 0) return false;

  //先计算冲四赢的
  MAX_SCORE = S.FOUR;
  MIN_SCORE = S.FIVE;

  var result = deeping(role, deep);
  if(result) {
    result.score = S.FOUR;
    return result;
  }

  if(onlyFour) return false;  //只计算冲四

  //再计算通过 活三 赢的；
  MAX_SCORE = S.THREE;
  MIN_SCORE = S.FOUR;
  result = deeping(role, deep);
  if(result) {
    result.score = S.THREE*2; //虽然不如活四分数高，但是还是比活三分数要高的
  }

  return result;

}

},{"./SCORE.js":1,"./board.js":3,"./config.js":5,"./debug.js":6,"./evaluate-point.js":7,"./role.js":11,"./zobrist.js":13}],5:[function(require,module,exports){
module.exports = {
  searchDeep: 6,  //搜索深度
  deepDecrease: .8, //按搜索深度递减分数，为了让短路径的结果比深路劲的分数高
  countLimit: 10, //gen函数返回的节点数量上限，超过之后将会按照分数进行截断
  checkmateDeep:  5,  //算杀深度
  cache: false,  //是否使用效率不高的置换表
}

},{}],6:[function(require,module,exports){
var debug = {};
module.exports = debug;

},{}],7:[function(require,module,exports){
/*
 * 启发式评价函数
 * 这个是专门给某一个空位打分的，不是给整个棋盘打分的
 * 并且是只给某一个角色打分
 */
var R = require("./role.js");
var score = require("./score.js");
/*
 * 表示在当前位置下一个棋子后的分数
 */

var s = function(board, p, role) {
  var result = 0;
  var count = 0, block = 0,
    secondCount = 0;  //另一个方向的count

  var len = board.length;

  function reset() {
    count = 1;
    block = 0;
    empty = -1;
    secondCount = 0;  //另一个方向的count
  }
  

  reset();

  for(var i=p[1]+1;true;i++) {
    if(i>=len) {
      block ++;
      break;
    }
    var t = board[p[0]][i];
    if(t === R.empty) {
      if(empty == -1 && i<len-1 && board[p[0]][i+1] == role) {
        empty = count;
        continue;
      } else {
        break;
      }
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }


  for(var i=p[1]-1;true;i--) {
    if(i<0) {
      block ++;
      break;
    }
    var t = board[p[0]][i];
    if(t === R.empty) {
      if(empty == -1 && i>0 && board[p[0]][i-1] == role) {
        empty = 0;  //注意这里是0，因为是从右往左走的
        continue;
      } else {
        break;
      }
    }
    if(t === role) {
      secondCount ++;
      empty !== -1 && empty ++;  //注意这里，如果左边又多了己方棋子，那么empty的位置就变大了
      continue;
    } else {
      block ++;
      break;
    }
  }

  count+= secondCount;


  result += countToScore(count, block, empty);

  //纵向
  reset();

  for(var i=p[0]+1;true;i++) {
    if(i>=len) {
      block ++;
      break;
    }
    var t = board[i][p[1]];
    if(t === R.empty) {
      if(empty == -1 && i<len-1 && board[i+1][p[1]] == role) {
        empty = count;
        continue;
      } else {
        break;
      }
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  for(var i=p[0]-1;true;i--) {
    if(i<0) {
      block ++;
      break;
    }
    var t = board[i][p[1]];
    if(t === R.empty) {
      if(empty == -1 && i>0 && board[i-1][p[1]] == role) {
        empty = 0;
        continue;
      } else {
        break;
      }
    }
    if(t === role) {
      secondCount++;
      empty !== -1 && empty ++;  //注意这里，如果左边又多了己方棋子，那么empty的位置就变大了
      continue;
    } else {
      block ++;
      break;
    }
  }

  count+= secondCount;
  result += countToScore(count, block, empty);


  // \\
  reset();

  for(var i=1;true;i++) {
    var x = p[0]+i, y = p[1]+i;
    if(x>=len || y>=len) {
      block ++;
      break;
    }
    var t = board[x][y];
    if(t === R.empty) {
      if(empty == -1 && (x<len-1 && y < len-1) && board[x+1][y+1] == role) {
        empty = count;
        continue;
      } else {
        break;
      }
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  for(var i=1;true;i++) {
    var x = p[0]-i, y = p[1]-i;
    if(x<0||y<0) {
      block ++;
      break;
    }
    var t = board[x][y];
    if(t === R.empty) {
      if(empty == -1 && (x>0 && y>0) && board[x-1][y-1] == role) {
        empty = 0;
        continue;
      } else {
        break;
      }
    }
    if(t === role) {
      secondCount ++;
      empty !== -1 && empty ++;  //注意这里，如果左边又多了己方棋子，那么empty的位置就变大了
      continue;
    } else {
      block ++;
      break;
    }
  }

  count+= secondCount;
  result += countToScore(count, block, empty);


  // \/
  reset();

  for(var i=1; true;i++) {
    var x = p[0]+i, y = p[1]-i;
    if(x<0||y<0||x>=len||y>=len) {
      block ++;
      break;
    }
    var t = board[x][y];
    if(t === R.empty) {
      if(empty == -1 && (x<len-1 && y<len-1) && board[x+1][y-1] == role) {
        empty = count;
        continue;
      } else {
        break;
      }
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  for(var i=1;true;i++) {
    var x = p[0]-i, y = p[1]+i;
    if(x<0||y<0||x>=len||y>=len) {
      block ++;
      break;
    }
    var t = board[x][y];
    if(t === R.empty) {
      if(empty == -1 && (x>0 && y>0) && board[x-1][y+1] == role) {
        empty = 0;
        continue;
      } else {
        break;
      }
    }
    if(t === role) {
      secondCount++;
      empty !== -1 && empty ++;  //注意这里，如果左边又多了己方棋子，那么empty的位置就变大了
      continue;
    } else {
      block ++;
      break;
    }
  }

  count+= secondCount;
  result += countToScore(count, block, empty);

  return fixScore(result);
}


var countToScore = function(count, block, empty) {

  if(empty === undefined) empty = 0;

  //没有空位
  if(empty <= 0) {
    if(count >= 5) return score.FIVE;
    if(block === 0) {
      switch(count) {
        case 1: return score.ONE;
        case 2: return score.TWO;
        case 3: return score.THREE;
        case 4: return score.FOUR;
      }
    }

    if(block === 1) {
      switch(count) {
        case 1: return score.BLOCKED_ONE;
        case 2: return score.BLOCKED_TWO;
        case 3: return score.BLOCKED_THREE;
        case 4: return score.BLOCKED_FOUR;
      }
    }

  } else if(empty === 1 || empty == count-1) {
    //第1个是空位
    if(count >= 6) {
      return score.FIVE;
    }
    if(block === 0) {
      switch(count) {
        case 2: return score.TWO/2;
        case 3: return score.THREE;
        case 4: return score.BLOCKED_FOUR;
        case 5: return score.FOUR;
      }
    }

    if(block === 1) {
      switch(count) {
        case 2: return score.BLOCKED_TWO;
        case 3: return score.BLOCKED_THREE;
        case 4: return score.BLOCKED_FOUR;
        case 5: return score.BLOCKED_FOUR;
      }
    }
  } else if(empty === 2 || empty == count-2) {
    //第二个是空位
    if(count >= 7) {
      return score.FIVE;
    }
    if(block === 0) {
      switch(count) {
        case 3: return score.THREE;
        case 4: 
        case 5: return score.BLOCKED_FOUR;
        case 6: return score.FOUR;
      }
    }

    if(block === 1) {
      switch(count) {
        case 3: return score.BLOCKED_THREE;
        case 4: return score.BLOCKED_FOUR;
        case 5: return score.BLOCKED_FOUR;
        case 6: return score.FOUR;
      }
    }

    if(block === 2) {
      switch(count) {
        case 4:
        case 5:
        case 6: return score.BLOCKED_FOUR;
      }
    }
  } else if(empty === 3 || empty == count-3) {
    if(count >= 8) {
      return score.FIVE;
    }
    if(block === 0) {
      switch(count) {
        case 4:
        case 5: return score.THREE;
        case 6: return score.BLOCKED_FOUR;
        case 7: return score.FOUR;
      }
    }

    if(block === 1) {
      switch(count) {
        case 4:
        case 5:
        case 6: return score.BLOCKED_FOUR;
        case 7: return score.FOUR;
      }
    }

    if(block === 2) {
      switch(count) {
        case 4:
        case 5:
        case 6:
        case 7: return score.BLOCKED_FOUR;
      }
    }
  } else if(empty === 4 || empty == count-4) {
    if(count >= 9) {
      return score.FIVE;
    }
    if(block === 0) {
      switch(count) {
        case 5:
        case 6:
        case 7:
        case 8: return score.FOUR;
      }
    }

    if(block === 1) {
      switch(count) {
        case 4:
        case 5:
        case 6:
        case 7: return score.BLOCKED_FOUR;
        case 8: return score.FOUR;
      }
    }

    if(block === 2) {
      switch(count) {
        case 5:
        case 6:
        case 7:
        case 8: return score.BLOCKED_FOUR;
      }
    }
  } else if(empty === 5 || empty == count-5) {
    return score.FIVE;
  }

  return 0;
}

var fixScore = function(type) {
  if(type < score.FOUR && type >= score.BLOCKED_FOUR) {

    if(type >= score.BLOCKED_FOUR && type < (score.BLOCKED_FOUR + score.THREE)) {
      //单独冲四，意义不大
      return score.THREE;
    } else if(type >= score.BLOCKED_FOUR + score.THREE && type < score.BLOCKED_FOUR * 2) {
      return score.FOUR;  //冲四活三，比双三分高，相当于自己形成活四
    } else {
      //双冲四 比活四分数也高
      return score.FOUR * 2;
    }
  }
  return type;
}


module.exports = s;

},{"./role.js":11,"./score.js":12}],8:[function(require,module,exports){
var threshold = 1.1;

module.exports = {
  greatThan: function(a, b) {
    return a >= b * threshold;
  },
  greatOrEqualThan: function(a, b) {
    return a * threshold >= b;
  },
  littleThan: function(a, b) {
    return a * threshold <= b;
  },
  littleOrEqualThan: function(a, b) {
    return a <= b * threshold;
  },
  equal: function(a, b) {
    return (a * threshold >= b) && (a <= b * threshold);
  }
}

},{}],9:[function(require,module,exports){
var R = require("./role");
var T = SCORE = require("./score.js");
var math = require("./math.js");
var checkmate = require("./checkmate.js");
var config = require("./config.js");
var debug = require("./debug.js");
var board = require("./board.js");

var MAX = SCORE.FIVE*10;
var MIN = -1*MAX;

var total=0, //总节点数
    steps=0,  //总步数
    count,  //每次思考的节点数
    PVcut,
    ABcut,  //AB剪枝次数
    cacheCount=0, //zobrist缓存节点数
    cacheGet=0; //zobrist缓存命中数量

var Cache = {};

var checkmateDeep = config.checkmateDeep;

/*
 * max min search
 * white is max, black is min
 */

var negamax = function(deep, _checkmateDeep) {
  var best = MIN;
  var points = board.gen();
  var bestPoints = [];

  count = 0;
  ABcut = 0;
  PVcut = 0;
  checkmateDeep = (_checkmateDeep == undefined ? checkmateDeep : _checkmateDeep);

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board.put(p, R.com);
    var v = - r(deep-1, -MAX, -best, R.hum);

    //边缘棋子的话，要把分数打折，避免电脑总喜欢往边上走
    if(p[0]<3 || p[0] > 11 || p[1] < 3 || p[1] > 11) {
      v = .5 * v;
    }

    //console.log(v, p);
    //如果跟之前的一个好，则把当前位子加入待选位子
    if(math.equal(v, best)) {
      bestPoints.push(p);
    }
    //找到一个更好的分，就把以前存的位子全部清除
    if(math.greatThan(v, best)) {
      best = v;
      bestPoints = [];
      bestPoints.push(p);
    }


    board.remove(p);
  }
  console.log("分数:"+best.toFixed(3)+", 待选节点:"+JSON.stringify(bestPoints));
  var result = bestPoints[Math.floor(bestPoints.length * Math.random())];
  result.score = best;
  steps ++;
  total += count;
  console.log('搜索节点数:'+ count+ ',AB剪枝次数:'+ABcut + ', PV剪枝次数:' + PVcut + ', 缓存命中:' + (cacheGet / cacheCount).toFixed(3) + ',' + cacheGet + '/' + cacheCount + ',算杀缓存命中:' + (debug.checkmate.cacheGet / debug.checkmate.cacheCount).toFixed(3) + ',' + debug.checkmate.cacheGet + '/'+debug.checkmate.cacheCount); //注意，减掉的节点数实际远远不止 ABcut 个，因为减掉的节点的子节点都没算进去。实际 4W个节点的时候，剪掉了大概 16W个节点
  console.log('当前统计：总共'+ steps + '步, ' + total + '个节点, 平均每一步' + Math.round(total/steps) +'个节点');
  console.log("================================");
  return result;
}

var r = function(deep, alpha, beta, role) {

  if(config.cache) {
    var c = Cache[board.zobrist.code];
    if(c) {
      if(c.deep >= deep) {
        cacheGet ++;
        return c.score;
      }
    }
  }

  var v = board.evaluate(role);
  count ++;
  if(deep <= 0 || math.greatOrEqualThan(v, T.FIVE)) {
    return v;
  }
  
  var best = MIN;
  var points = board.gen();

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board.put(p, role);

    var v = - r(deep-1, -beta, -1 *( best > alpha ? best : alpha), R.reverse(role)) * config.deepDecrease;
    board.remove(p);

    if(math.greatThan(v, best)) {
      best = v;
    }
    if(math.greatOrEqualThan(v, beta)) { //AB 剪枝
      ABcut ++;
      cache(deep, v);
      return v;
    }
  }
  if( (deep == 2 || deep == 3 ) && math.littleThan(best, SCORE.THREE*2) && math.greatThan(best, SCORE.THREE * -1)) {
    var mate = checkmate(role, checkmateDeep);
    if(mate) {
      var score = mate.score * Math.pow(.8, mate.length);
      cache(deep, score);
      return score;
    }
  }
  cache(deep, best);
  
  return best;
}

var cache = function(deep, score) {
  if(!config.cache) return;
  Cache[board.zobrist.code] = {
    deep: deep,
    score: score
  }
  cacheCount ++;
}

var deeping = function(deep) {
  deep = deep === undefined ? config.searchDeep : deep;
  //迭代加深
  //注意这里不要比较分数的大小，因为深度越低算出来的分数越不靠谱，所以不能比较大小，而是是最高层的搜索分数为准
  var result;
  for(var i=2;i<=deep; i+=2) {
    result = negamax(i);
    if(math.greatOrEqualThan(result.score, SCORE.FOUR)) return result;
  }
  return result;
}
module.exports = deeping;

},{"./board.js":3,"./checkmate.js":4,"./config.js":5,"./debug.js":6,"./math.js":8,"./role":11,"./score.js":12}],10:[function(require,module,exports){
(function (process){
var AI = require("./ai.js");
var readline = require('readline');
console.log(readline);

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

var ai = new AI();

var boardMode = false;

rl.on('line', function(line){
  var args = line.split(" ");
  if(boardMode) {
    var t = line.split(",");
  } else if(args[0] === "BEGIN") {
    var r = ai.begin();
    return r.joint(",");
  } else if(args[0] === "START") {
    ai.start(args[1] ? parseInt(args[1]) : 20);
    console.log("OK");
  } else if (args[0] === "TURN") {
    var p = args[1].split(",");
    var r = ai.trun(parseInt(p[0]), parseInt(p[1]));
    console.log(r.join(","));
  } else if(line == "BOARD") {
    boardMode = true;
  } else if(line == "DONE") {
    boardMode = false;
    var r = ai.begin();
    return r.join(",");
  }

})

}).call(this,require('_process'))
},{"./ai.js":2,"_process":15,"readline":14}],11:[function(require,module,exports){
module.exports = {
  com: 1,
  hum: 2,
  empty: 0,
  reverse: function(r) {
    return r == 1 ? 2 : 1;
  }
}

},{}],12:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],13:[function(require,module,exports){
var R = require("./role.js");

var Zobrist = function(size) {
  this.size = size || 15;
}

Zobrist.prototype.init = function() {
  this.com = [];
  this.hum = [];
  for(var i=0;i<this.size*this.size;i++) {
    this.com.push(this._rand());
    this.hum.push(this._rand());
  }

  this.code = this._rand();
}

Zobrist.prototype._rand = function() {
  return Math.floor(Math.random() * 1000000000);  //再多一位就溢出了。。
}

Zobrist.prototype.go = function(x, y, role) {
  var index = this.size * x + y;
  this.code ^= (role == R.com ? this.com[index] : this.hum[index]);
  return this.code;
}

var z = new Zobrist();
z.init();

module.exports = z;

},{"./role.js":11}],14:[function(require,module,exports){

},{}],15:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[10]);
