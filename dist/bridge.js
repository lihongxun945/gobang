(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
/*
 * 棋型表示
 * 用一个6位数表示棋型，从高位到低位分别表示
 * 连五，活四，眠四，活三，活二/眠三，活一/眠二, 眠一
 */

// 给单个棋型打分

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

// 总分数
var score = {
  TWO: 'TWO', // 活二
  TWO_THREE: 'TWO_THREE', // 双三
  BLOCK_FOUR: 'BLOCKED_FOUR', // 冲四
  FOUR_THREE: 'FOUR_THREE', // 冲四活三
  FOUR: 'FOUR', // 活四
  FIVE: 'FIVE', // 连五
}

},{}],2:[function(require,module,exports){
var m = require("./negamax.js");
var R = require("./role.js");
var zobrist = require("./zobrist.js");
var config = require("./config.js");
var board = require("./board.js");
var opening = require('./opening.js');

var AI = function() {
}


//初始化,开始游戏
AI.prototype.start = function(size) {
  board.init(size);
}


//电脑下棋
AI.prototype.begin = function(first) {
  if(board.steps.length === 0) {
    this.set(7, 7, R.com);
    return [7, 7];
  }
  var p;
  if (config.opening) {
    p = opening(board)
  }
  p = p || m(config.searchDeep);
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

},{"./board.js":4,"./config.js":6,"./negamax.js":10,"./opening.js":11,"./role.js":12,"./zobrist.js":15}],3:[function(require,module,exports){
module.exports = {
  create: function (w, h) {
    var r = []
    for(var i=0;i<w;i++) {
      var row = new Array()
      for(var j=0;j<h;j++) {
        row.push(0)
      }
      r.push(row)
    }
    return r
  }
}

},{}],4:[function(require,module,exports){
var scorePoint = require("./evaluate-point.js");
var zobrist = require("./zobrist.js");
var R = require("./role.js");
var S = require("./score.js");
var config = require("./config.js");
var array = require("./arrary.js");

//冲四的分其实肯定比活三高，但是如果这样的话容易形成盲目冲四的问题，所以如果发现电脑有无意义的冲四，则将分数降低到和活三一样
//而对于冲四活三这种杀棋，则将分数提高。
var fixScore = function(type) {
  if(type < S.FOUR && type >= S.BLOCKED_FOUR) {

    if(type >= S.BLOCKED_FOUR && type < (S.BLOCKED_FOUR + S.THREE)) {
      //单独冲四，意义不大
      return S.THREE;
    } else if(type >= S.BLOCKED_FOUR + S.THREE && type < S.BLOCKED_FOUR * 2) {
      return S.FOUR;  //冲四活三，比双三分高，相当于自己形成活四
    } else {
      //双冲四 比活四分数也高
      return S.FOUR * 2;
    }
  }
  return type;
}

var Board = function() {
}

Board.prototype.init = function(sizeOrBoard) {
  this.evaluateCache = {};
  this.steps = [];
  this.allSteps = [];
  this.zobrist = zobrist;
  this._last = [false, false]; // 记录最后一步
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


  // 存储双方得分
  this.comScore = array.create(size, size);
  this.humScore = array.create(size, size);

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

  this.initScore();
  
}

Board.prototype.initScore = function() {

  var board = this.board;

  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      // 空位，对双方都打分
      if(board[i][j] == R.empty) {
        if(this.hasNeighbor([i, j], 2, 2)) { //必须是有邻居的才行
          var cs = scorePoint(this, [i, j], R.com);
          var hs = scorePoint(this, [i, j], R.hum);
          this.comScore[i][j] = cs;
          this.humScore[i][j] = hs;
        }

      } else if (board[i][j] == R.com) { // 对电脑打分，玩家此位置分数为0
        this.comScore[i][j] = scorePoint(this, [i, j], R.com);
        this.humScore[i][j] = 0;
      } else if (board[i][j] == R.hum) { // 对玩家打分，电脑位置分数为0
        this.humScore[i][j] = scorePoint(this, [i, j], R.hum);
        this.comScore[i][j] = 0;
      }
    }
  }
}

//只更新一个点附近的分数
// 参见 evaluate point 中的代码，为了优化性能，在更新分数的时候可以指定只更新某一个方向的分数
Board.prototype.updateScore = function(p) {
  var radius = 6,
      board = this.board,
      self = this,
      len = this.board.length;

  function update(x, y, dir) {
    var cs = scorePoint(self, [x, y], R.com, dir);
    var hs = scorePoint(self, [x, y], R.hum, dir);
    self.comScore[x][y] = cs;
    self.humScore[x][y] = hs;
  }
  // -
  for(var i=-radius;i<radius;i++) {
    var x = p[0], y = p[1]+i;
    if(y<0) continue;
    if(y>=len) break;
    if(board[x][y] !== R.empty) continue;
    update(x, y, 0);
  }

  // |
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1];
    if(x<0) continue;
    if(x>=len) break;
    if(board[x][y] !== R.empty) continue;
    update(x, y, 1);
  }

  // \
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1]+i;
    if(x<0 || y<0) continue;
    if(x>=len || y>=len) break;
    if(board[x][y] !== R.empty) continue;
    update(x, y, 2);
  }

  // /
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1]-i;
    if(x<0 || y<0) continue;
    if(x>=len || y>=len) continue;
    if(board[x][y] !== R.empty) continue;
    update(x, y, 3);
  }


}

//下子
Board.prototype.put = function(p, role, record) {
  this.board[p[0]][p[1]] = role;
  this.zobrist.go(p[0], p[1], role);
  if (record) this.steps.push(p);
  this.updateScore(p);
  this.allSteps.push(p);
}
// 最后一次下子位置
Board.prototype.last = function(role) {
  for(var i=this.allSteps.length-1;i>=0;i--) {
    var p = this.allSteps[i];
    if(this.board[p[0]][p[1]] === role) return p;
  }
  return false;
}

//移除棋子
Board.prototype.remove = function(p) {
  var r = this.board[p[0]][p[1]];
  this.zobrist.go(p[0], p[1], r);
  this.board[p[0]][p[1]] = R.empty;
  this.updateScore(p);
  this.allSteps.pop();
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
//这里只算当前分，而不是在空位下一步之后的分
Board.prototype.evaluate = function(role) {

  //这里加了缓存，但是并没有提升速度
  if(config.cache && this.evaluateCache[this.zobrist.code]) return this.evaluateCache[this.zobrist.code];

  this.comMaxScore = - S.FIVE;
  this.humMaxScore = - S.FIVE;

  var board = this.board;

  //遍历出最高分，开销不大
  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == R.com) {
        this.comMaxScore = Math.max(this.comScore[i][j], this.comMaxScore);
      } else if (board[i][j] == R.hum) {
        this.humMaxScore = Math.max(this.humScore[i][j], this.humMaxScore);
      }
    }
  }
  this.comMaxScore = fixScore(this.comMaxScore);
  this.humMaxScore = fixScore(this.humMaxScore);
  var result = (role == R.com ? 1 : -1) * (this.comMaxScore - this.humMaxScore);
  this.evaluateCache[this.zobrist.code] = result;

  return result;

}

//启发函数
/*
 * 变量starBread的用途是用来进行米子计算
 * 所谓米子计算，只是，如果第一步尝试了一个位置A，那么接下来尝试的位置有两种情况：
 * 1: 大于等于活三的位置
 * 2: 在A的米子位置上
 * 注意只有对小于活三的棋才进行starSpread优化
 */


Board.prototype.gen = function(starSpread) {
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
      var p = [i, j];
      if(board[i][j] == R.empty) {
        var neighbor = [2,2];
        if(this.steps.length < 6) neighbor = [1, 1];
        if(this.hasNeighbor([i, j], neighbor[0], neighbor[1])) { //必须是有邻居的才行
          var scoreHum = this.humScore[i][j];
          var scoreCom = this.comScore[i][j];
          var maxScore = Math.max(scoreCom, scoreHum);
          p.score = maxScore

          // 结果分级
          if (maxScore >= S.THREE) {
            p.level = 1
          } else if (maxScore >= S.TWO) {
            p.level = 3
          } else {
            p.level = 5
          }

          if(scoreCom >= S.FIVE) {//先看电脑能不能连成5
            return [p];
          } else if(scoreHum >= S.FIVE) {//再看玩家能不能连成5
            //别急着返回，因为遍历还没完成，说不定电脑自己能成五。
            fives.push(p);
          } else if(scoreCom >= S.FOUR) {
            fours.unshift(p);
          } else if(scoreHum >= S.FOUR) {
            fours.push(p);
          } else if(scoreCom >= S.BLOCKED_FOUR) {
            blockedfours.unshift(p);
          } else if(scoreHum >= S.BLOCKED_FOUR) {
            blockedfours.push(p);
          } else if(scoreCom >= 2*S.THREE) {
            //能成双三也行
            twothrees.unshift(p);
          } else if(scoreHum >= 2*S.THREE) {
            twothrees.push([i,j]);
          } else if(scoreCom >= S.THREE) {
            threes.unshift(p);
          } else if(scoreHum >= S.THREE) {
            threes.push(p);
          } else if(scoreCom >= S.TWO) {
            if (!starSpread) twos.unshift(p);
            else if (starSpread && this.isStarSpread(p, this.last(R.com))) twos.unshift(p);
          } else if(scoreHum >= S.TWO) {
            if (!starSpread) twos.unshift(p);
            else if (starSpread && this.isStarSpread(p, this.last(R.hum))) twos.unshift(p);
          } else {
            if (!starSpread) neighbors.push(p);
            else if (starSpread && this.isStarSpread(p, this.last(R.hum))) neighbors.push(p);
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

  var result = blockedfours.concat(twothrees).concat(threes);

  //双三很特殊，因为能形成双三的不一定比一个活三强
  if(twothrees.length) {
    return result;
  }

  twos.sort(function(a, b) { return b.score - a.score });

  result = result.concat(twos.length ? twos : neighbors);

  //这种分数低的，就不用全部计算了
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

// a点是否在b点的starSpread路线上
Board.prototype.isStarSpread = function (a, b) {
  if (!b) return true

  if (! ((a[0] === b[0] || a[1] === b[1] || (Math.abs(a[0]-b[0]) === Math.abs(a[1] - b[1]))) && Math.abs(a[0]-b[0]) <= 3 && Math.abs(a[1]-b[1]) <= 3)) return false;
  // 同一行
  if (a[0] === b[0]) {
    // a 在左边
    if (a[1] < b[1]) {
      var empty=0;
      for(var i=a[1]+1;i<b[1];i++) {
        if (this.board[a[0]][i] === R.reverse(this.board[b[0]][b[1]])) return false;
        if (this.board[a[0]][i] === 0) empty++;
      }
      return empty <= 1;
    }
    // a 在右边
    if (a[1] > b[1]) {
      var empty=0;
      for(var i=a[1]-1;i>b[1];i--) {
        if (this.board[a[0]][i] === R.reverse(this.board[b[0]][b[1]])) return false;
        if (this.board[a[0]][i] === 0) empty++;
      }
      return empty <= 1;
    }
  }
  // 同一列
  if (a[1] === b[1]) {
    // a 在上边
    if (a[0] < b[0]) {
      var empty=0;
      for(var i=a[0]+1;i<b[0];i++) {
        if (this.board[i][a[1]] === R.reverse(this.board[b[0]][b[1]])) return false;
        if (this.board[i][a[1]] === 0) empty++;
      }
      return empty <= 1;
    }
    // a 在下边
    if (a[0] > b[0]) {
      var empty=0;
      for(var i=a[0]-1;i<b[0];i--) {
        if (this.board[i][a[1]] === R.reverse(this.board[b[0]][b[1]])) return false;
        if (this.board[i][a[1]] === 0) empty++;
      }
      return empty <= 1;
    }
  }
  // a 在左上
  if (a[0] < b[0] && a[1] < b[1]) {
    var empty=0;
    for(var i=1;a[0]+i<b[0];i++) {
      if (this.board[a[0]+i][a[1]+i] === R.reverse(this.board[b[0]][b[1]])) return false;
      if (this.board[a[0]+i][a[1]+i] === 0) empty++;
    }
    return empty <= 1;
  }
  // a 在右下
  if (a[0] > b[0] && a[1] > b[1]) {
    var empty=0;
    for(var i=1;a[0]-i>b[0];i++) {
      if (this.board[a[0]-i][a[1]-i] === R.reverse(this.board[b[0]][b[1]])) return false;
      if (this.board[a[0]-i][a[1]-i] === 0) empty++;
    }
    return empty <= 1;
  }
  // a 在左下
  if (a[0] > b[0] && a[1] < b[1]) {
    var empty=0;
    for(var i=1;a[0]-i>b[0];i++) {
      if (this.board[a[0]-i][a[1]+i] === R.reverse(this.board[b[0]][b[1]])) return false;
      if (this.board[a[0]-i][a[1]+i] === 0) empty++;
    }
    return empty <= 1;
  }
  // a 在右上
  if (a[0] < b[0] && a[1] > b[1]) {
    var empty=0;
    for(var i=1;a[0]+i>b[0];i++) {
      if (this.board[a[0]+i][a[1]-i] === R.reverse(this.board[b[0]][b[1]])) return false;
      if (this.board[a[0]+i][a[1]-i] === 0) empty++;
    }
    return empty <= 1;
  }

  return false;
}

var board = new Board();

module.exports = board;

},{"./arrary.js":3,"./config.js":6,"./evaluate-point.js":8,"./role.js":12,"./score.js":13,"./zobrist.js":15}],5:[function(require,module,exports){
var AI = require("./ai.js");
var R = require("./role.js");
var config = require('./config.js');

var ai = new AI();

onmessage = function(e) {
  var d = e.data;
  if(d.type == "START") {
    ai.start(15);
  } else if(d.type == "BEGIN") {
    var p = ai.begin();
    postMessage(p);
  } else if(d.type == "GO") {
    var p = ai.turn(e.data.x, e.data.y);
    postMessage(p);
  } else if(d.type == "BACK") {
    ai.back();
  } else if(d.type == "CONFIG") {
    var d = e.data.config
    if (d.searchDeep) config.searchDeep = d.searchDeep
    if (d.countLimit) config.countLimit = d.countLimit
    if (d.checkmateDeep) config.checkmateDeep = d.checkmateDeep
    if (d.timeLimit) config.timeLimit = d.timeLimit
  }
}

},{"./ai.js":2,"./config.js":6,"./role.js":12}],6:[function(require,module,exports){
module.exports = {
  opening: true, // 使用开局库
  searchDeep: 6,  //搜索深度
  countLimit: 16, //gen函数返回的节点数量上限，超过之后将会按照分数进行截断
  timeLimit: 10, // 时间限制，秒
  checkmateDeep:  5,  //算杀深度
  random: false,// 在分数差不多的时候是不是随机选择一个走
  log: true,
  cache: false,  //是否使用效率不高的置换表
}

},{}],7:[function(require,module,exports){
var debug = {};
module.exports = debug;

},{}],8:[function(require,module,exports){
/*
 * 启发式评价函数
 * 这个是专门给某一个位置打分的，不是给整个棋盘打分的
 * 并且是只给某一个角色打分
 */
var R = require("./role.js");
var score = require("./score.js");
/*
 * 表示在当前位置下一个棋子后的分数
 * 为了性能考虑，增加了一个dir参数，如果没有传入则默认计算所有四个方向，如果传入值，则只计算其中一个方向的值
 */

var s = function(b, p, role, dir) {
  var board = b.board;
  var result = 0,
      radius = 8;
  var count = 0, block = 0,
    secondCount = 0;  //另一个方向的count

  var len = board.length;

  function reset() {
    count = 1;
    block = 0;
    empty = -1;
    secondCount = 0;  //另一个方向的count
  }
  

  if (dir === undefined || dir === 0) {
    reset();

    // -

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

    b.scoreCache[role][0][p[0]][p[1]] = countToScore(count, block, empty);
  }
  result += b.scoreCache[role][0][p[0]][p[1]]

  if (dir === undefined || dir === 1) {

    // |
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

    count += secondCount;

    b.scoreCache[role][1][p[0]][p[1]] = countToScore(count, block, empty);
  } 
  result += b.scoreCache[role][1][p[0]][p[1]]


  // \
  if (dir === undefined || dir === 2) {
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

    b.scoreCache[role][2][p[0]][p[1]] = countToScore(count, block, empty);
  }
  result += b.scoreCache[role][2][p[0]][p[1]]


  // /
  if (dir === undefined || dir === 3) {
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

    count += secondCount;

    b.scoreCache[role][3][p[0]][p[1]] = countToScore(count, block, empty);
  }
  result += b.scoreCache[role][3][p[0]][p[1]]

  return result;
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

module.exports = s;

},{"./role.js":12,"./score.js":13}],9:[function(require,module,exports){
var threshold = 1.3;

var equal = function(a, b) {
  b = b || 0.01
  return b >= 0 ? ((a >= b / threshold) && (a <= b * threshold))
          : ((a >= b * threshold) && (a <= b / threshold))
}
var greatThan = function(a, b) {
  return b >= 0 ? (a >= (b+0.1) * threshold) : (a >= (b+0.1) / threshold); // 注意处理b为0的情况，通过加一个0.1 做简单的处理
}
var greatOrEqualThan = function(a, b) {
  return equal(a, b) || greatThan(a, b);
}
var littleThan = function(a, b) {
  return b >= 0 ? (a <= (b-0.1) / threshold) : (a <= (b-0.1) * threshold);
}
var littleOrEqualThan = function(a, b) {
  return equal(a, b) || littleThan(a, b);
}

var containPoint = function (arrays, p) {
  for (var i=0;i<arrays.length;i++) {
    var a = arrays[i];
    if (a[0] === p[0] && a[1] === p[1]) return true
  }
  return false
}

var pointEqual = function (a, b) {
  return a[0] === b[0] && a[1] === b[1]
}

module.exports = {
  equal: equal,
  greatThan: greatThan,
  greatOrEqualThan: greatOrEqualThan,
  littleThan: littleThan,
  littleOrEqualThan: littleOrEqualThan,
  containPoint: containPoint,
  pointEqual: pointEqual
}

},{}],10:[function(require,module,exports){
var R = require("./role");
var T = SCORE = require("./score.js");
var math = require("./math.js");
var vcx = require("./vcx.js");
var config = require("./config.js");
var debug = require("./debug.js");
var board = require("./board.js");

var MAX = SCORE.FIVE*10;
var MIN = -1*MAX;

var steps=0,  //总步数
    count=0,  //每次思考的节点数
    PVcut,
    ABcut,  //AB剪枝次数
    cacheCount=0, //zobrist缓存节点数
    cacheGet=0; //zobrist缓存命中数量

var Cache = {};

var checkmateDeep;
var startTime; // 开始时间，用来计算每一步的时间
var allBestPoints; // 记录迭代过程中得到的全部最好点

/*
 * max min search
 * white is max, black is min
 */

var negamax = function(deep, _checkmateDeep) {
  var points = board.gen();
  var bestPoints = [];
  var start = new Date();

  count = 0;
  ABcut = 0;
  PVcut = 0;
  checkmateDeep = (_checkmateDeep == undefined ? config.checkmateDeep : _checkmateDeep);

  if (points[0].level > 1) {
    // 最大值就是能成活二的，这时0.x秒就搜索完了，增加深度以充分利用时间
    deep += 4
  }

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board.put(p, R.com);
    // 越靠后的点，搜索深度约低，因为出现好棋的可能性比较小
    // TODO: 有的时候 p.level 会变成未定义，不知道是什么原因
    var v = r(deep-(p.level||1), -MAX, -MIN, R.hum, 1);
    v.score *= -1
    board.remove(p);
    console.log(p, v)
    p.v = v
    // 如果在更浅层的搜索中得到了一个最好值，那么这次搜索到的时候要更新它的结果，因为搜的越深结果约准
    // TODO

    // 超时判定
    if ((+ new Date()) - start > config.timeLimit * 1000) {
      console.log('timeout...');
      points = points.slice(0, i+1);
      break; // 超时，退出循环
    }
  }
  //排序
  points.sort(function (a,b) {
    if (math.equal(a.v.score,b.v.score)) {
      // 大于零是优势，尽快获胜，因此取步数短的
      // 小于0是劣势，尽量拖延，因此取步数长的
      if (a.v.score >= 0) return a.v.step - b.v.step
      else return b.v.step - a.v.step
    }
    else return (b.v.score - a.v.score)
  })
  var best = points[0];
  bestPoints = points.filter(function (p) {
    return math.greatOrEqualThan(p.v.score, best.v.score) && p.v.step === best.v.step
  });
  var result = points[0];
  result.score = points[0].v.score;
  result.step = points[0].v.step;
  config.log && console.log("可选节点：" + bestPoints.join(';'));
  config.log && console.log("选择节点：" + points[0] + ", 分数:"+result.score.toFixed(3)+", 步数:" + result.step);
  steps ++;
  var time = (new Date() - start)/1000
  config.log && console.log('搜索节点数:'+ count+ ',AB剪枝次数:'+ABcut + ', PV剪枝次数:' + PVcut + ', 缓存命中:' + (cacheGet / cacheCount).toFixed(3) + ',' + cacheGet + '/' + cacheCount + ',算杀缓存命中:' + (debug.checkmate.cacheGet / debug.checkmate.cacheCount).toFixed(3) + ',' + debug.checkmate.cacheGet + '/'+debug.checkmate.cacheCount); //注意，减掉的节点数实际远远不止 ABcut 个，因为减掉的节点的子节点都没算进去。实际 4W个节点的时候，剪掉了大概 16W个节点
  config.log && console.log('当前统计：总共'+ steps + '步, ' + count + '个节点, 耗时:' + time.toFixed(2) + 's, 平均每一步' + Math.round(count/steps) +'个节点, NPS:' + Math.floor(count/ time) + 'N/S');
  config.log && console.log("================================");
  return result;
}

var r = function(deep, alpha, beta, role, step) {

  if(config.cache) {
    var c = Cache[board.zobrist.code];
    if(c) {
      if(c.deep >= deep) {
        cacheGet ++;
        return c.score;
      }
    }
  }

  var _e = board.evaluate(role);

  count ++;
  if(deep <= 0 || math.greatOrEqualThan(_e, T.FIVE)) {
    return {
      score: _e,
      step: step
    };
  }
  
  var best = {
    score: MIN,
    step: step
  }
  var points = board.gen();

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board.put(p, role);

    var v = r(deep-(p.level||1), -beta, -1 *( best.score > alpha ? best.score : alpha), R.reverse(role), step+1);
    v.score *= -1;
    board.remove(p);

    if(math.greatThan(v.score, best.score)) {
      best = v;
    }
    if(math.greatOrEqualThan(v.score, beta)) { //AB 剪枝
      ABcut ++;
      cache(deep, v);
      return v;
    }
  }
  // vcf
  // 自己没有形成活四，对面也没有高于冲四的棋型，那么先尝试VCF
  if(math.littleThan(best.score, SCORE.FOUR) && math.greatThan(best.score, SCORE.BLOCKED_FOUR * -2)) {
    var mate = vcx.vcf(role, checkmateDeep);
    if(mate) {
      var score = mate.score;
      cache(deep, score);
      return {
        score: score,
        step: step + mate.length
      }
    }
  }
  // vct
  // 自己没有形成活三，对面也没有高于活三的棋型，那么尝试VCT
  if(math.littleThan(best.score, SCORE.THREE*2) && math.greatThan(best.score, SCORE.THREE * -2)) {
    var mate = vcx.vct(role, checkmateDeep);
    if(mate) {
      var score = mate.score;
      cache(deep, score);
      return {
        score: score,
        step: step + mate.length
      }
    }
  }
  cache(deep, best);
  
  //console.log('end: role:' + role + ', deep:' + deep + ', best: ' + best)
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
  start = (+ new Date())
  allBestPoints = [];
  deep = deep === undefined ? config.searchDeep : deep;
  //迭代加深
  //注意这里不要比较分数的大小，因为深度越低算出来的分数越不靠谱，所以不能比较大小，而是是最高层的搜索分数为准
  var result;
  for(var i=2;i<=deep; i+=2) {
    result = negamax(i);
    if(math.greatOrEqualThan(result.score, SCORE.FOUR)) return result;
    if(i>2) allBestPoints.push(result); // 深度只有2的不考虑，太不准了
  }
  allBestPoints.sort(function (a, b) {
    // 如果分数差不多，相信步数长的那个
    if (math.equal(a.score, b.score)) return b.step > a.step;
    else return b.score > a.score
  })
  console.log(allBestPoints);
  return allBestPoints[0];
}
module.exports = deeping;

},{"./board.js":4,"./config.js":6,"./debug.js":7,"./math.js":9,"./role":12,"./score.js":13,"./vcx.js":14}],11:[function(require,module,exports){
/*
 * 一个简单的开局库，用花月+浦月必胜开局
 */
var math = require('./math.js');
/**
 * -2-
 * -1-
 * ---
 */
var huayue = function (board) {
  console.log('使用花月开局')
  var s = board.steps
  if (math.pointEqual(s[1], [6, 7])) {
    if (s.length === 2) return [6, 8]
  }
  if (math.pointEqual(s[1], [7, 6])) {
    if (s.length === 2) return [6, 6]
  }
  if (math.pointEqual(s[1], [8, 7])) {
    if (s.length === 2) return [8, 6]
  }
  if (math.pointEqual(s[1], [7, 8])) {
    if (s.length === 2) return [8, 8]
  }
}

var puyue = function (board) {
  console.log('使用浦月开局')
  var s = board.steps
  if (math.pointEqual(s[1], [6, 6])) {
    if (s.length === 2) return [6, 8]
  }
  if (math.pointEqual(s[1], [8, 6])) {
    if (s.length === 2) return [6, 6]
  }
  if (math.pointEqual(s[1], [8, 8])) {
    if (s.length === 2) return [8, 6]
  }
  if (math.pointEqual(s[1], [6, 8])) {
    if (s.length === 2) return [8, 8]
  }
}

var match = function (board) {
  var s = board.steps;
  if (s[0] !== 1) return false
  if (s.length > 2) return false
  if (math.containPoint([[6,7],[7,6],[8,7],[7,8]], s[1])) return huayue(board)
  else if (math.containPoint([[6,6],[8,8],[8,6],[6,8]], s[1])) return puyue(board)
  return false
}

module.exports = match

},{"./math.js":9}],12:[function(require,module,exports){
module.exports = {
  com: 1,
  hum: 2,
  empty: 0,
  reverse: function(r) {
    return r == 1 ? 2 : 1;
  }
}

},{}],13:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],14:[function(require,module,exports){
/*
 * 算杀
 * 算杀的原理和极大极小值搜索是一样的
 * 不过算杀只考虑冲四活三这类对方必须防守的棋
 * 因此算杀的复杂度虽然是 M^N ，但是底数M特别小，可以算到16步以上的杀棋。
 * VCT 连续活三胜
 * VCF 连续冲四胜利
 */

/*
 * 基本思路
 * 电脑有活三或者冲四，认为是玩家必须防守的
 * 玩家防守的时候却不一定根据电脑的棋来走，而是选择走自己最好的棋，比如有可能是自己选择冲四
 */

var R = require("./role.js");
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
  if(result) {
    //config.log && console.log("算杀成功("+time+"毫秒, "+ debugNodeCount + "个节点):" + JSON.stringify(result));
  } else {
    //console.log("算杀失败("+time+"毫秒)");
  }
  return result;
}

var vcx = function(role, deep, onlyFour) {

  deep = deep === undefined ? config.checkmateDeep : deep;
  if(deep <= 0) return false;

  if (onlyFour) {
    //计算冲四赢的
    MAX_SCORE = S.BLOCKED_FOUR;
    MIN_SCORE = S.FIVE;

    var result = deeping(role, deep);
    if(result) {
      result.score = S.FOUR;
      return result;
    }
    return false
  } else {
    //计算通过 活三 赢的；
    MAX_SCORE = S.THREE;
    MIN_SCORE = S.BLOCKED_FOUR;
    result = deeping(role, deep);
    if(result) {
      result.score = S.THREE*2; //连续冲三赢，就等于是双三
    }

    return result;
  }

  return false;

}

// 连续冲四
var vcf = function (role, deep) {
  return vcx(role, deep, true)
}

// 连续活三
var vct = function (role, deep) {
  return vcx(role, deep, false)
}

module.exports = {
  vct: vct,
  vcf: vcf
}


},{"./SCORE.js":1,"./board.js":4,"./config.js":6,"./debug.js":7,"./role.js":12,"./zobrist.js":15}],15:[function(require,module,exports){
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

},{"./role.js":12}]},{},[5]);
