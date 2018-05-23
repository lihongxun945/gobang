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
  zobrist.init(); // 注意重新初始化
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
  // 无论是不是空位 都需要更新
  // -
  for(var i=-radius;i<radius;i++) {
    var x = p[0], y = p[1]+i;
    if(y<0) continue;
    if(y>=len) break;
    update(x, y, 0);
  }

  // |
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1];
    if(x<0) continue;
    if(x>=len) break;
    update(x, y, 1);
  }

  // \
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1]+i;
    if(x<0 || y<0) continue;
    if(x>=len || y>=len) break;
    update(x, y, 2);
  }

  // /
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1]-i;
    if(x<0 || y<0) continue;
    if(x>=len || y>=len) continue;
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


Board.prototype.logSteps = function() {
  console.log(this.allSteps.map((d) => '['+d[0]+','+d[1]+']').join(','))
}

//棋面估分
//这里只算当前分，而不是在空位下一步之后的分
Board.prototype.evaluate = function(role) {

  //这里加了缓存，但是并没有提升速度
  if(config.cache && this.evaluateCache[this.zobrist.code]) return this.evaluateCache[this.zobrist.code];

  // 这里都是用正整数初始化的，所以初始值是0
  this.comMaxScore = 0;
  this.humMaxScore = 0;

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
  if (config.cache) this.evaluateCache[this.zobrist.code] = result;

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

/*
 * gen 函数的排序是非常重要的，因为好的排序能极大提升AB剪枝的效率。
 * 而对结果的排序，是要根据role来的
 */


Board.prototype.gen = function(role, onlyThrees, starSpread) {
  var fives = [];
  var comfours=[];
  var humfours=[];
  var comblockedfours = [];
  var humblockedfours = [];
  var comtwothrees=[];
  var humtwothrees=[];
  var comthrees = [];
  var humthrees = [];
  var comtwos = [];
  var humtwos = [];
  var neighbors = [];

  var board = this.board;

  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      var p = [i, j];
      if(board[i][j] == R.empty) {
        var neighbor = [2,2];
        if(this.steps.length < 6) neighbor = [1, 1];
        if(this.hasNeighbor([i, j], neighbor[0], neighbor[1])) { //必须是有邻居的才行
          var scoreHum = p.scoreHum = this.humScore[i][j];
          var scoreCom = p.scoreCom = this.comScore[i][j];
          var maxScore = Math.max(scoreCom, scoreHum);
          p.score = maxScore

          // 结果分级
          if (maxScore >= S.THREE) {
            p.level = 1
          } else if (maxScore >= S.TWO) {
            p.level = 2
          } else {
            p.level = 3
          }

          if(scoreCom >= S.FIVE) {//先看电脑能不能连成5
            fives.push(p);
          } else if(scoreHum >= S.FIVE) {//再看玩家能不能连成5
            //别急着返回，因为遍历还没完成，说不定电脑自己能成五。
            fives.push(p);
          } else if(scoreCom >= S.FOUR) {
            comfours.push(p);
          } else if(scoreHum >= S.FOUR) {
            humfours.push(p);
          } else if(scoreCom >= S.BLOCKED_FOUR) {
            comblockedfours.push(p);
          } else if(scoreHum >= S.BLOCKED_FOUR) {
            humblockedfours.push(p);
          } else if(scoreCom >= 2*S.THREE) {
            //能成双三也行
            comtwothrees.push(p);
          } else if(scoreHum >= 2*S.THREE) {
            humtwothrees.push(p);
          } else if(scoreCom >= S.THREE) {
            comthrees.push(p);
          } else if(scoreHum >= S.THREE) {
            humthrees.push(p);
          } else if(scoreCom >= S.TWO) {
            if (!starSpread) comtwos.unshift(p);
            else if (starSpread && this.isStarSpread(p, this.last(R.com))) comtwos.unshift(p);
          } else if(scoreHum >= S.TWO) {
            if (!starSpread) humtwos.unshift(p);
            else if (starSpread && this.isStarSpread(p, this.last(R.hum))) humtwos.unshift(p);
          } else {
            if (!starSpread) neighbors.push(p);
            else if (starSpread && this.isStarSpread(p, this.last(R.hum))) neighbors.push(p);
          }
        }
      }
    }
  }

  //如果成五，是必杀棋，直接返回
  if(fives.length) return fives;
  
  // 自己能活四，则直接活四，不考虑冲四
  if (role === R.com && comfours.length) return comfours;
  if (role === R.hum && humfours.length) return humfours;

  // 对面有活四和冲四，自己连冲四都没有，则只考虑对面的活四，不考虑对面的冲四
  
  if (role === R.com && !comfours.length && !comblockedfours.length && humfours.length) return humfours;
  if (role === R.hum && !humfours.length && !humblockedfours.length && comfours.length) return comfours;

  // 对面有活四自己有冲四，则都考虑下
  
  var fours = role === R.com ? comfours.concat(humfours) : humfours.concat(comfours);
  var blockedfours = role === R.com ? comblockedfours.concat(humblockedfours) : humblockedfours.concat(comblockedfours);
  if (fours.length) return fours.concat(blockedfours);

  var result = [];
  if (role === R.com) {
    result = comblockedfours
      .concat(humblockedfours)
      .concat(comtwothrees)
      .concat(humtwothrees)
      .concat(comthrees)
      .concat(humthrees)
  }
  if (role === R.hum) {
    result = humblockedfours
      .concat(comblockedfours)
      .concat(humtwothrees)
      .concat(comtwothrees)
      .concat(humthrees)
      .concat(comthrees)
  }

  result.sort(function(a, b) { return b.score - a.score })

  //双三很特殊，因为能形成双三的不一定比一个活三强
  if(comtwothrees.length || humtwothrees.length) {
    return result;
  }


  var twos;
  if (role === R.com) twos = comtwos.concat(humtwos);
  else twos = humtwos.concat(comtwos);

  twos.sort(function(a, b) { return b.score - a.score });

  // 只返回大于等于活三的棋
  // 这里注意，如果没有活三，那么要仍然记得返回一个值，不然在搜索中会因为没有子节点而返回默认的MIN
  if (onlyThrees) {
    return result.length ? result : [twos[0]];
  }
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
    if (d.vcxDeep) config.vcxDeep = d.vcxDeep
    if (d.timeLimit) config.timeLimit = d.timeLimit
  }
}

},{"./ai.js":2,"./config.js":6,"./role.js":12}],6:[function(require,module,exports){
module.exports = {
  opening: true, // 使用开局库
  searchDeep: 8,  //搜索深度
  countLimit: 20, //gen函数返回的节点数量上限，超过之后将会按照分数进行截断
  timeLimit: 100, // 时间限制，秒
  vcxDeep:  5,  //算杀深度
  random: false,// 在分数差不多的时候是不是随机选择一个走
  log: true,
  // TODO: 目前开启缓存后，搜索会出现一些未知的bug
  cache: false // 使用缓存, 其实只有搜索的缓存有用，其他缓存几乎无用。因为只有搜索的缓存命中后就能剪掉一整个分支，这个分支一般会包含很多个点。而在其他地方加缓存，每次命中只能剪掉一个点，影响不大。
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
var S = require('./score.js');
var threshold = 1.1;

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

var round = function (score) {
  var neg = score < 0 ? -1 : 1;
  var abs = Math.abs(score);
  if (abs <= S.ONE / 2) return 0;
  if (abs <= S.TWO / 2 && abs > S.ONE / 2) return neg * S.ONE;
  if (abs <= S.THREE / 2 && abs > S.TWO / 2) return neg * S.TWO;
  if (abs <= S.THREE * 1.5 && abs > S.THREE / 2) return neg * S.THREE;
  if (abs <= S.FOUR / 2 && abs > S.THREE * 1.5) return neg * S.THREE*2;
  if (abs <= S.FIVE / 2 && abs > S.FOUR / 2) return neg * S.FOUR;
  return neg * S.FIVE;
}

module.exports = {
  equal: equal,
  greatThan: greatThan,
  greatOrEqualThan: greatOrEqualThan,
  littleThan: littleThan,
  littleOrEqualThan: littleOrEqualThan,
  containPoint: containPoint,
  pointEqual: pointEqual,
  round: round
}

},{"./score.js":13}],10:[function(require,module,exports){
/*
 * 思路：
 * 每次开始迭代前，先生成一组候选列表，然后在迭代加深的过程中不断更新这个列表中的分数
 * 这样迭代的深度越大，则分数越精确，并且，任何时候达到时间限制而中断迭代的时候，能保证这个列表中的分数都是可靠的
 */
var R = require("./role");
var T = SCORE = require("./score.js");
var math = require("./math.js");
var vcx = require("./vcx.js");
var config = require("./config.js");
var debug = require("./debug.js");
var board = require("./board.js");

var MAX = SCORE.FIVE*10;
var MIN = -1*MAX;

var bestScore;

var count=0,  //每次思考的节点数
    PVcut,
    ABcut,  //AB剪枝次数
    cacheCount=0, //zobrist缓存节点数
    cacheGet=0; //zobrist缓存命中数量

var candidates; 

var Cache = {};

var vcxDeep;
var startTime; // 开始时间，用来计算每一步的时间
var allBestPoints; // 记录迭代过程中得到的全部最好点

var DEBUG = false;

var deepLimit;

/*
 * max min search
 * white is max, black is min
 */

var negamax = function(deep, _vcxDeep) {

  count = 0;
  ABcut = 0;
  PVcut = 0;
  vcxDeep = (_vcxDeep == undefined ? config.vcxDeep : _vcxDeep);

  if (candidates[0].level > 1) {
    // 最大值就是能成活二的，这时0.x秒就搜索完了，增加深度以充分利用时间
    deep += 2
  }

  for(var i=0;i<candidates.length;i++) {
    var p = candidates[i];
    board.put(p, R.com);
    var steps = [p];
    // 越靠后的点，搜索深度约低，因为出现好棋的可能性比较小
    var v = r(deep-(p.level||1), -MAX, -bestScore, R.hum, 1, steps.slice(0));
    v.score *= -1
    bestScore = Math.max(bestScore, v.score)
    board.remove(p);
    p.v = v

    // 超时判定
    if ((+ new Date()) - start > config.timeLimit * 1000) {
      console.log('timeout...');
      break; // 超时，退出循环
    }
  }

  console.log('迭代完成,deep=' + deep)
  console.log(candidates.map(function (d) {
    return '['+d[0]+','+d[1]+']'
      + ',score:' + d.v.score
      + ',step:' + d.v.step
      + ',steps:' + d.v.steps.join(';')
      + (d.v.vct ? (',vct:' + d.v.vct.join(';')) : '')
      + (d.v.vcf ? (',vcf:' + d.v.vcf.join(';')) : '')
  }))

}

var r = function(deep, alpha, beta, role, step, steps) {

  DEBUG && board.logSteps();
  if(config.cache) {
    var c = Cache[board.zobrist.code];
    if(c) {
      if(c.deep >= deep) { // 如果缓存中的结果搜索深度不比当前小，则结果完全可用
        cacheGet ++;
        return c.score;
      } else {
        // 如果缓存的结果中搜索深度比当前小，那么任何一方出现双三及以上结果的情况下可用
        // TODO: 只有这一个缓存策略是会导致开启缓存后会和以前的结果有一点点区别的，其他几种都是透明的缓存策略
        if (math.greatOrEqualThan(c.score, SCORE.THREE * 2) || math.littleOrEqualThan(c.score, SCORE.THREE * -2)) {
          cacheGet ++;
          return c.score;
        }
      }
    }
  }

  var _e = board.evaluate(role);

  count ++;
  // 搜索到底 或者已经胜利
  if(deep <= 1 || math.greatOrEqualThan(_e, T.FIVE) || math.littleOrEqualThan(_e, -T.FIVE)) {
  //// 经过测试，把算杀放在对子节点的搜索之后，比放在前面速度更快一些。
  //// vcf
  //// 自己没有形成活四，对面也没有形成活四，那么先尝试VCF
  //if(math.littleThan(_e, SCORE.FOUR) && math.greatThan(_e, SCORE.FOUR * -1)) {
  //  mate = vcx.vcf(role, vcxDeep);
  //  if(mate) {
  //    DEBUG && console.log('vcf success')
  //    v = {
  //      score: mate.score,
  //      step: step + mate.length,
  //      steps: steps,
  //      vcf: mate // 一个标记为，表示这个值是由vcx算出的
  //    }
  //    return v
  //  }
  //} // vct
  //// 自己没有形成活三，对面也没有高于活三的棋型，那么尝试VCT
  //if(math.littleThan(_e, SCORE.THREE*2) && math.greatThan(_e, SCORE.THREE * -2)) {
  //  var mate = vcx.vct(role, vcxDeep);
  //  if(mate) {
  //    DEBUG && console.log('vct success')
  //    v = {
  //      score: mate.score,
  //      step: step + mate.length,
  //      steps: steps,
  //      vct: mate // 一个标记为，表示这个值是由vcx算出的
  //    }
  //  return v
  //  }
  //}
    return {
      score: _e,
      step: step,
      steps: steps
    };
  }
  
  var best = {
    score: MIN,
    step: step,
    steps: steps
  }
  var points = board.gen(role, (deepLimit - deep) > 4);

  DEBUG && console.log('points:' + points.map((d) => '['+d[0]+','+d[1]+']').join(','))
  DEBUG && console.log('A~B: ' + alpha + '~' + beta)

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board.put(p, role);

    var _deep = deep-(p.level||1);

    // 冲四延伸
    if ( (role == R.com && p.scoreHum >= SCORE.FIVE) ||
      (role == R.hum && p.scoreCom >= SCORE.FIVE)) _deep = deep

    var _steps = steps.slice(0);
    _steps.push(p);
    var v = r(_deep, -beta, -alpha, R.reverse(role), step+1, _steps);
    v.score *= -1;
    board.remove(p);

    

    if(math.greatThan(v.score, best.score)) {
      best = v;
    }
    alpha = Math.max(best.score, alpha);
    //AB 剪枝
    // 这里不要直接返回原来的值，因为这样上一层会以为就是这个分，实际上这个节点直接剪掉就好了，根本不用考虑，也就是直接给一个很大的值让他被减掉
    // 这样会导致一些差不多的节点都被剪掉，但是没关系，不影响棋力
    // 一定要注意，这里必须是 greatThan 即 明显大于，而不是 greatOrEqualThan 不然会出现很多差不多的有用分支被剪掉，会出现致命错误
    if(math.greatOrEqualThan(v.score, beta)) {
      DEBUG && console.log('AB Cut [' + p[0] + ',' + p[1] + ']' + v.score + ' >= ' + beta + '')
      ABcut ++;
      v.score = MAX-1; // 被剪枝的，直接用一个极小值来记录
      if (math.greatThan(v.score, beta) && v.score >= T.THREE * 2) v.abcut = 1; // 剪枝标记
      cache(deep, v);
      return v;
    }
  }

  cache(deep, best);
  
  //console.log('end: role:' + role + ', deep:' + deep + ', best: ' + best)
  return best;
}

var cache = function(deep, score) {
  if(!config.cache) return;
  if (score.abcut) return; // 被剪枝的暂时不缓存
  Cache[board.zobrist.code] = {
    deep: deep,
    score: score
  }
  cacheCount ++;
}

var deeping = function(deep) {
  candidates = board.gen(R.com);
  start = (+ new Date())
  bestScore = MIN;
  deep = deep === undefined ? config.searchDeep : deep;

  var result;

  //迭代加深
  for(var i=2;i<=deep; i+=2) {
    deepLimit = i;
    negamax(i);
    // 每次迭代剔除必败点，直到没有必败点或者只剩最后一个点
    // 实际上，由于必败点几乎都会被AB剪枝剪掉，因此这段代码几乎不会生效
    var newCandidates = candidates.filter(function (d) {
      return !d.abcut;
    })
    candidates = newCandidates.length ? newCandidates : [candidates[0]]; // 必败了，随便走走

    if (math.littleThan(bestScore, T.THREE * 2)) bestScore = MIN; // 如果能找到双三以上的棋，则保留bestScore做剪枝，否则直接设置为最小值
  }

  // 美化一下
  candidates = candidates.map(function (d) {
    var r = [d[0], d[1]]
    r.score = d.v.score
    r.step = d.v.step
    if (d.v.vct) r.vct = d.v.vct
    if (d.v.vcf) r.vcf = d.v.vcf
    return r;
  })

  // 排序
  // 经过测试，这个如果放在上面的for循环中（就是每次迭代都排序），反而由于迭代深度太浅，排序不好反而会降低搜索速度。
  candidates.sort(function (a,b) {
    if (math.equal(a.score,b.score)) {
      // 大于零是优势，尽快获胜，因此取步数短的
      // 小于0是劣势，尽量拖延，因此取步数长的
      if (a.score >= 0) {
        if (a.step !== b.step) return a.step - b.step
        else return b.score - a.score // 否则 选取当前分最高的（直接评分)
      }
      else {
        if (a.step !== b.step) return b.step - a.step
        else return b.score - a.score // 否则 选取当前分最高的（直接评分)
      }
    }
    else return (b.score - a.score)
  })

  var best = candidates[0];
  bestPoints = candidates.filter(function (p) {
    return math.greatOrEqualThan(p.score, best.score) && p.step === best.step
  });
  var result = candidates[0];
  config.log && console.log("可选节点：" + bestPoints.join(';'));
  config.log && console.log("选择节点：" + candidates[0] + ", 分数:"+result.score.toFixed(3)+", 步数:" + result.step);
  var time = (new Date() - start)/1000
  config.log && console.log('搜索节点数:'+ count+ ',AB剪枝次数:'+ABcut + ', PV剪枝次数:' + PVcut);
  config.log && console.log('搜索缓存:' + '总数 ' + cacheCount + ', 命中率 ' + (cacheGet / cacheCount * 100).toFixed(3) + '%, ' + cacheGet + '/' + cacheCount)
  config.log && console.log('算杀缓存:' + '总数 ' + debug.checkmate.cacheCount + ', 命中:' + (debug.checkmate.cacheHit / debug.checkmate.totalCount * 100).toFixed(3) + '% ,' + debug.checkmate.cacheHit + '/'+debug.checkmate.totalCount);
  //注意，减掉的节点数实际远远不止 ABcut 个，因为减掉的节点的子节点都没算进去。实际 4W个节点的时候，剪掉了大概 16W个节点
  config.log && console.log('当前统计：' + count + '个节点, 耗时:' + time.toFixed(2) + 's, NPS:' + Math.floor(count/ time) + 'N/S');
  config.log && console.log("================================");
  return result;
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

var Cache = {
  vct: {},
  vcf: {}
}

var debugNodeCount = 0;

var MAX_SCORE = S.THREE;
var MIN_SCORE = S.FOUR;

var debugCheckmate = debug.checkmate = {
  cacheCount: 0, // cache 总数

  totalCount: 0, // 算杀总数
  cacheHit: 0, // 缓存命中
}

var lastMaxPoint, lastMinPoint;

//找到所有比目标分数大的位置
//注意，不止要找自己的，还要找对面的，
var findMax = function(role, score) {
  var result = [],
      fives = [];
  for(var i=0;i<board.board.length;i++) {
    for(var j=0;j<board.board[i].length;j++) {
      if(board.board[i][j] == R.empty) {
        var p = [i, j];

        // 注意，防一手对面冲四
        // 所以不管谁能连成五，先防一下。
        if (board.humScore[p[0]][p[1]] >= S.FIVE) {
          p.score = S.FIVE
          if (role === R.com) p.score *= -1
          fives.push(p);
        } else if (board.comScore[p[0]][p[1]] >= S.FIVE) {
          p.score = S.FIVE
          if (role === R.hum) p.score *= -1
          fives.push(p);
        } else {

          if ( (!lastMaxPoint || (i === lastMaxPoint[0] || j === lastMaxPoint[1] || (Math.abs(i-lastMaxPoint[0]) === Math.abs(j-lastMaxPoint[1]))))) {
            var s = (role == R.com ? board.comScore[p[0]][p[1]] : board.humScore[p[0]][p[1]]);
            p.score = s;
            if(s >= score) {
              result.push(p);
            }
          }
        }
      }
    }
  }
  // 能连五，则直接返回
  // 但是注意不要碰到连五就返回，而是把所有连五的点都考虑一遍，不然可能出现自己能连却防守别人的问题
  if (fives.length) return fives;
  //注意对结果进行排序
  result.sort(function(a, b) {
    return b.score - a.score;
  });
  return result;
}


// MIN层
//找到所有比目标分数大的位置
//这是MIN层，所以己方分数要变成负数
var findMin = function(role, score) {
  var result = [];
  var fives = [];
  var fours = [];
  var blockedfours = [];
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
        
        if(s2 >= S.FIVE) {
          p.score = s2;
          fives.push(p);
          continue;
        } 

        if(s1 >= S.FOUR) {
          p.score = -s1;
          fours.unshift(p);
          continue;
        }
        if(s2 >= S.FOUR) {
          p.score = s2;
          fours.push(p);
          continue;
        }

        if(s1 >= S.BLOCKED_FOUR) {
          p.score = -s1;
          blockedfours.unshift(p);
          continue;
        }
        if(s2 >= S.BLOCKED_FOUR) {
          p.score = s2;
          blockedfours.push(p);
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
  if(fives.length) return fives;

  // 注意冲四，因为虽然冲四的分比活四低，但是他的防守优先级是和活四一样高的，否则会忽略冲四导致获胜的走法
  if(fours.length) return fours.concat(blockedfours);
  
  //注意对结果进行排序
  //因为fours可能不存在，这时候不要忽略了 blockedfours
  result = blockedfours.concat(result);
  result.sort(function(a, b) {
    return Math.abs(b.score) - Math.abs(a.score);
  });
  return result;
}

var max = function(role, deep, totalDeep) {
  debugNodeCount ++;
  //board.logSteps();
  if(deep <= 1) return false;

  var points = findMax(role, MAX_SCORE);
  if(points.length && points[0].score >= S.FOUR) return [points[0]]; //为了减少一层搜索，活四就行了。
  if(points.length == 0) return false;
  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board.put(p, role);
    // 如果是防守对面的冲四，那么不用记下来
    if (!p.score <= -S.FIVE) lastMaxPoint = p;
    var m = min(R.reverse(role), deep-1);
    board.remove(p);
    if(m) {
      if(m.length) {
        m.unshift(p); //注意 unshift 方法返回的是新数组长度，而不是新数组本身
        return m;
      } else {
        return [p];
      }
    }
  }
  return false;
}


//只要有一种方式能防守住，就可以了
var min = function(role, deep) {
  debugNodeCount ++;
  var w = board.win();
  //board.logSteps();
  if(w == role) return false;
  if(w == R.reverse(role)) return true;
  if(deep <= 1) return false;
  var points = findMin(role, MIN_SCORE);
  if(points.length == 0) return false;
  if(points.length && -1 * points[0].score  >= S.FOUR) return false; //为了减少一层搜索，活四就行了。

  var cands = [];
  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board.put(p, role);
    lastMinPoint = p;
    var m = max(R.reverse(role), deep-1);
    board.remove(p);
    if(m) {
      m.unshift(p);
      cands.push(m);
      continue;
    } else {
      return false; //只要有一种能防守住
    }
  }
  var result = cands[Math.floor(cands.length*Math.random())];  //无法防守住
  return result;
}

var cache = function(result, vcf) {
  if(!config.cache) return;
  if (vcf) Cache.vcf[zobrist.code] = result
  else Cache.vct[zobrist.code] = result
  debugCheckmate.cacheCount ++;
}
var getCache = function(vcf) {
  if(!config.cache) return;
  debugCheckmate.totalCount ++;
  var result;
  if (vcf) result = Cache.vcf[zobrist.code]
  else result = Cache.vct[zobrist.code]
  if (result) debugCheckmate.cacheHit ++;
  return result;
}

//迭代加深
var deeping = function(role, deep, totalDeep) {
  var start = new Date();
  debugNodeCount = 0;
  for(var i=1;i<=deep;i++) {
    lastMaxPoint = undefined;
    lastMinPoint = undefined;
    var result = max(role, i, deep);
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

  deep = deep === undefined ? config.vcxDeep : deep;
  
  if(deep <= 0) return false;

  if (onlyFour) {
    //计算冲四赢的
    MAX_SCORE = S.BLOCKED_FOUR;
    MIN_SCORE = S.FIVE;

    var result = deeping(role, deep, deep);
    if(result) {
      result.score = S.FOUR;
      return result;
    }
    return false
  } else {
    //计算通过 活三 赢的；
    MAX_SCORE = S.THREE;
    MIN_SCORE = S.BLOCKED_FOUR;
    result = deeping(role, deep, deep);
    if(result) {
      result.score = S.THREE*2; //连续冲三赢，就等于是双三
    }

    return result;
  }

  return false;

}

// 连续冲四
var vcf = function (role, deep) {
  var c = getCache(true);
  if (c) return c;
  var result = vcx(role, deep, true);
  cache(result, true);
  return result;
}

// 连续活三
var vct = function (role, deep) {
  var c = getCache();
  if (c) return c;
  var result = vcx(role, deep, false);
  cache(result);
  return result;
}

module.exports = {
  vct: vct,
  vcf: vcf
}


},{"./SCORE.js":1,"./board.js":4,"./config.js":6,"./debug.js":7,"./role.js":12,"./zobrist.js":15}],15:[function(require,module,exports){
var R = require("./role.js");
var Random = require("random-js")();

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
  return Random.integer(1, 1000000000);  //再多一位就溢出了。。
}

Zobrist.prototype.go = function(x, y, role) {
  var index = this.size * x + y;
  this.code ^= (role == R.com ? this.com[index] : this.hum[index]);
  return this.code;
}

var z = new Zobrist();
z.init();

module.exports = z;

},{"./role.js":12,"random-js":16}],16:[function(require,module,exports){
/*jshint eqnull:true*/
(function (root) {
  "use strict";

  var GLOBAL_KEY = "Random";

  var imul = (typeof Math.imul !== "function" || Math.imul(0xffffffff, 5) !== -5 ?
    function (a, b) {
      var ah = (a >>> 16) & 0xffff;
      var al = a & 0xffff;
      var bh = (b >>> 16) & 0xffff;
      var bl = b & 0xffff;
      // the shift by 0 fixes the sign on the high part
      // the final |0 converts the unsigned value into a signed value
      return (al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0;
    } :
    Math.imul);

  var stringRepeat = (typeof String.prototype.repeat === "function" && "x".repeat(3) === "xxx" ?
    function (x, y) {
      return x.repeat(y);
    } : function (pattern, count) {
      var result = "";
      while (count > 0) {
        if (count & 1) {
          result += pattern;
        }
        count >>= 1;
        pattern += pattern;
      }
      return result;
    });

  function Random(engine) {
    if (!(this instanceof Random)) {
      return new Random(engine);
    }

    if (engine == null) {
      engine = Random.engines.nativeMath;
    } else if (typeof engine !== "function") {
      throw new TypeError("Expected engine to be a function, got " + typeof engine);
    }
    this.engine = engine;
  }
  var proto = Random.prototype;

  Random.engines = {
    nativeMath: function () {
      return (Math.random() * 0x100000000) | 0;
    },
    mt19937: (function (Int32Array) {
      // http://en.wikipedia.org/wiki/Mersenne_twister
      function refreshData(data) {
        var k = 0;
        var tmp = 0;
        for (;
          (k | 0) < 227; k = (k + 1) | 0) {
          tmp = (data[k] & 0x80000000) | (data[(k + 1) | 0] & 0x7fffffff);
          data[k] = data[(k + 397) | 0] ^ (tmp >>> 1) ^ ((tmp & 0x1) ? 0x9908b0df : 0);
        }

        for (;
          (k | 0) < 623; k = (k + 1) | 0) {
          tmp = (data[k] & 0x80000000) | (data[(k + 1) | 0] & 0x7fffffff);
          data[k] = data[(k - 227) | 0] ^ (tmp >>> 1) ^ ((tmp & 0x1) ? 0x9908b0df : 0);
        }

        tmp = (data[623] & 0x80000000) | (data[0] & 0x7fffffff);
        data[623] = data[396] ^ (tmp >>> 1) ^ ((tmp & 0x1) ? 0x9908b0df : 0);
      }

      function temper(value) {
        value ^= value >>> 11;
        value ^= (value << 7) & 0x9d2c5680;
        value ^= (value << 15) & 0xefc60000;
        return value ^ (value >>> 18);
      }

      function seedWithArray(data, source) {
        var i = 1;
        var j = 0;
        var sourceLength = source.length;
        var k = Math.max(sourceLength, 624) | 0;
        var previous = data[0] | 0;
        for (;
          (k | 0) > 0; --k) {
          data[i] = previous = ((data[i] ^ imul((previous ^ (previous >>> 30)), 0x0019660d)) + (source[j] | 0) + (j | 0)) | 0;
          i = (i + 1) | 0;
          ++j;
          if ((i | 0) > 623) {
            data[0] = data[623];
            i = 1;
          }
          if (j >= sourceLength) {
            j = 0;
          }
        }
        for (k = 623;
          (k | 0) > 0; --k) {
          data[i] = previous = ((data[i] ^ imul((previous ^ (previous >>> 30)), 0x5d588b65)) - i) | 0;
          i = (i + 1) | 0;
          if ((i | 0) > 623) {
            data[0] = data[623];
            i = 1;
          }
        }
        data[0] = 0x80000000;
      }

      function mt19937() {
        var data = new Int32Array(624);
        var index = 0;
        var uses = 0;

        function next() {
          if ((index | 0) >= 624) {
            refreshData(data);
            index = 0;
          }

          var value = data[index];
          index = (index + 1) | 0;
          uses += 1;
          return temper(value) | 0;
        }
        next.getUseCount = function() {
          return uses;
        };
        next.discard = function (count) {
          uses += count;
          if ((index | 0) >= 624) {
            refreshData(data);
            index = 0;
          }
          while ((count - index) > 624) {
            count -= 624 - index;
            refreshData(data);
            index = 0;
          }
          index = (index + count) | 0;
          return next;
        };
        next.seed = function (initial) {
          var previous = 0;
          data[0] = previous = initial | 0;

          for (var i = 1; i < 624; i = (i + 1) | 0) {
            data[i] = previous = (imul((previous ^ (previous >>> 30)), 0x6c078965) + i) | 0;
          }
          index = 624;
          uses = 0;
          return next;
        };
        next.seedWithArray = function (source) {
          next.seed(0x012bd6aa);
          seedWithArray(data, source);
          return next;
        };
        next.autoSeed = function () {
          return next.seedWithArray(Random.generateEntropyArray());
        };
        return next;
      }

      return mt19937;
    }(typeof Int32Array === "function" ? Int32Array : Array)),
    browserCrypto: (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function" && typeof Int32Array === "function") ? (function () {
      var data = null;
      var index = 128;

      return function () {
        if (index >= 128) {
          if (data === null) {
            data = new Int32Array(128);
          }
          crypto.getRandomValues(data);
          index = 0;
        }

        return data[index++] | 0;
      };
    }()) : null
  };

  Random.generateEntropyArray = function () {
    var array = [];
    var engine = Random.engines.nativeMath;
    for (var i = 0; i < 16; ++i) {
      array[i] = engine() | 0;
    }
    array.push(new Date().getTime() | 0);
    return array;
  };

  function returnValue(value) {
    return function () {
      return value;
    };
  }

  // [-0x80000000, 0x7fffffff]
  Random.int32 = function (engine) {
    return engine() | 0;
  };
  proto.int32 = function () {
    return Random.int32(this.engine);
  };

  // [0, 0xffffffff]
  Random.uint32 = function (engine) {
    return engine() >>> 0;
  };
  proto.uint32 = function () {
    return Random.uint32(this.engine);
  };

  // [0, 0x1fffffffffffff]
  Random.uint53 = function (engine) {
    var high = engine() & 0x1fffff;
    var low = engine() >>> 0;
    return (high * 0x100000000) + low;
  };
  proto.uint53 = function () {
    return Random.uint53(this.engine);
  };

  // [0, 0x20000000000000]
  Random.uint53Full = function (engine) {
    while (true) {
      var high = engine() | 0;
      if (high & 0x200000) {
        if ((high & 0x3fffff) === 0x200000 && (engine() | 0) === 0) {
          return 0x20000000000000;
        }
      } else {
        var low = engine() >>> 0;
        return ((high & 0x1fffff) * 0x100000000) + low;
      }
    }
  };
  proto.uint53Full = function () {
    return Random.uint53Full(this.engine);
  };

  // [-0x20000000000000, 0x1fffffffffffff]
  Random.int53 = function (engine) {
    var high = engine() | 0;
    var low = engine() >>> 0;
    return ((high & 0x1fffff) * 0x100000000) + low + (high & 0x200000 ? -0x20000000000000 : 0);
  };
  proto.int53 = function () {
    return Random.int53(this.engine);
  };

  // [-0x20000000000000, 0x20000000000000]
  Random.int53Full = function (engine) {
    while (true) {
      var high = engine() | 0;
      if (high & 0x400000) {
        if ((high & 0x7fffff) === 0x400000 && (engine() | 0) === 0) {
          return 0x20000000000000;
        }
      } else {
        var low = engine() >>> 0;
        return ((high & 0x1fffff) * 0x100000000) + low + (high & 0x200000 ? -0x20000000000000 : 0);
      }
    }
  };
  proto.int53Full = function () {
    return Random.int53Full(this.engine);
  };

  function add(generate, addend) {
    if (addend === 0) {
      return generate;
    } else {
      return function (engine) {
        return generate(engine) + addend;
      };
    }
  }

  Random.integer = (function () {
    function isPowerOfTwoMinusOne(value) {
      return ((value + 1) & value) === 0;
    }

    function bitmask(masking) {
      return function (engine) {
        return engine() & masking;
      };
    }

    function downscaleToLoopCheckedRange(range) {
      var extendedRange = range + 1;
      var maximum = extendedRange * Math.floor(0x100000000 / extendedRange);
      return function (engine) {
        var value = 0;
        do {
          value = engine() >>> 0;
        } while (value >= maximum);
        return value % extendedRange;
      };
    }

    function downscaleToRange(range) {
      if (isPowerOfTwoMinusOne(range)) {
        return bitmask(range);
      } else {
        return downscaleToLoopCheckedRange(range);
      }
    }

    function isEvenlyDivisibleByMaxInt32(value) {
      return (value | 0) === 0;
    }

    function upscaleWithHighMasking(masking) {
      return function (engine) {
        var high = engine() & masking;
        var low = engine() >>> 0;
        return (high * 0x100000000) + low;
      };
    }

    function upscaleToLoopCheckedRange(extendedRange) {
      var maximum = extendedRange * Math.floor(0x20000000000000 / extendedRange);
      return function (engine) {
        var ret = 0;
        do {
          var high = engine() & 0x1fffff;
          var low = engine() >>> 0;
          ret = (high * 0x100000000) + low;
        } while (ret >= maximum);
        return ret % extendedRange;
      };
    }

    function upscaleWithinU53(range) {
      var extendedRange = range + 1;
      if (isEvenlyDivisibleByMaxInt32(extendedRange)) {
        var highRange = ((extendedRange / 0x100000000) | 0) - 1;
        if (isPowerOfTwoMinusOne(highRange)) {
          return upscaleWithHighMasking(highRange);
        }
      }
      return upscaleToLoopCheckedRange(extendedRange);
    }

    function upscaleWithinI53AndLoopCheck(min, max) {
      return function (engine) {
        var ret = 0;
        do {
          var high = engine() | 0;
          var low = engine() >>> 0;
          ret = ((high & 0x1fffff) * 0x100000000) + low + (high & 0x200000 ? -0x20000000000000 : 0);
        } while (ret < min || ret > max);
        return ret;
      };
    }

    return function (min, max) {
      min = Math.floor(min);
      max = Math.floor(max);
      if (min < -0x20000000000000 || !isFinite(min)) {
        throw new RangeError("Expected min to be at least " + (-0x20000000000000));
      } else if (max > 0x20000000000000 || !isFinite(max)) {
        throw new RangeError("Expected max to be at most " + 0x20000000000000);
      }

      var range = max - min;
      if (range <= 0 || !isFinite(range)) {
        return returnValue(min);
      } else if (range === 0xffffffff) {
        if (min === 0) {
          return Random.uint32;
        } else {
          return add(Random.int32, min + 0x80000000);
        }
      } else if (range < 0xffffffff) {
        return add(downscaleToRange(range), min);
      } else if (range === 0x1fffffffffffff) {
        return add(Random.uint53, min);
      } else if (range < 0x1fffffffffffff) {
        return add(upscaleWithinU53(range), min);
      } else if (max - 1 - min === 0x1fffffffffffff) {
        return add(Random.uint53Full, min);
      } else if (min === -0x20000000000000 && max === 0x20000000000000) {
        return Random.int53Full;
      } else if (min === -0x20000000000000 && max === 0x1fffffffffffff) {
        return Random.int53;
      } else if (min === -0x1fffffffffffff && max === 0x20000000000000) {
        return add(Random.int53, 1);
      } else if (max === 0x20000000000000) {
        return add(upscaleWithinI53AndLoopCheck(min - 1, max - 1), 1);
      } else {
        return upscaleWithinI53AndLoopCheck(min, max);
      }
    };
  }());
  proto.integer = function (min, max) {
    return Random.integer(min, max)(this.engine);
  };

  // [0, 1] (floating point)
  Random.realZeroToOneInclusive = function (engine) {
    return Random.uint53Full(engine) / 0x20000000000000;
  };
  proto.realZeroToOneInclusive = function () {
    return Random.realZeroToOneInclusive(this.engine);
  };

  // [0, 1) (floating point)
  Random.realZeroToOneExclusive = function (engine) {
    return Random.uint53(engine) / 0x20000000000000;
  };
  proto.realZeroToOneExclusive = function () {
    return Random.realZeroToOneExclusive(this.engine);
  };

  Random.real = (function () {
    function multiply(generate, multiplier) {
      if (multiplier === 1) {
        return generate;
      } else if (multiplier === 0) {
        return function () {
          return 0;
        };
      } else {
        return function (engine) {
          return generate(engine) * multiplier;
        };
      }
    }

    return function (left, right, inclusive) {
      if (!isFinite(left)) {
        throw new RangeError("Expected left to be a finite number");
      } else if (!isFinite(right)) {
        throw new RangeError("Expected right to be a finite number");
      }
      return add(
        multiply(
          inclusive ? Random.realZeroToOneInclusive : Random.realZeroToOneExclusive,
          right - left),
        left);
    };
  }());
  proto.real = function (min, max, inclusive) {
    return Random.real(min, max, inclusive)(this.engine);
  };

  Random.bool = (function () {
    function isLeastBitTrue(engine) {
      return (engine() & 1) === 1;
    }

    function lessThan(generate, value) {
      return function (engine) {
        return generate(engine) < value;
      };
    }

    function probability(percentage) {
      if (percentage <= 0) {
        return returnValue(false);
      } else if (percentage >= 1) {
        return returnValue(true);
      } else {
        var scaled = percentage * 0x100000000;
        if (scaled % 1 === 0) {
          return lessThan(Random.int32, (scaled - 0x80000000) | 0);
        } else {
          return lessThan(Random.uint53, Math.round(percentage * 0x20000000000000));
        }
      }
    }

    return function (numerator, denominator) {
      if (denominator == null) {
        if (numerator == null) {
          return isLeastBitTrue;
        }
        return probability(numerator);
      } else {
        if (numerator <= 0) {
          return returnValue(false);
        } else if (numerator >= denominator) {
          return returnValue(true);
        }
        return lessThan(Random.integer(0, denominator - 1), numerator);
      }
    };
  }());
  proto.bool = function (numerator, denominator) {
    return Random.bool(numerator, denominator)(this.engine);
  };

  function toInteger(value) {
    var number = +value;
    if (number < 0) {
      return Math.ceil(number);
    } else {
      return Math.floor(number);
    }
  }

  function convertSliceArgument(value, length) {
    if (value < 0) {
      return Math.max(value + length, 0);
    } else {
      return Math.min(value, length);
    }
  }
  Random.pick = function (engine, array, begin, end) {
    var length = array.length;
    var start = begin == null ? 0 : convertSliceArgument(toInteger(begin), length);
    var finish = end === void 0 ? length : convertSliceArgument(toInteger(end), length);
    if (start >= finish) {
      return void 0;
    }
    var distribution = Random.integer(start, finish - 1);
    return array[distribution(engine)];
  };
  proto.pick = function (array, begin, end) {
    return Random.pick(this.engine, array, begin, end);
  };

  function returnUndefined() {
    return void 0;
  }
  var slice = Array.prototype.slice;
  Random.picker = function (array, begin, end) {
    var clone = slice.call(array, begin, end);
    if (!clone.length) {
      return returnUndefined;
    }
    var distribution = Random.integer(0, clone.length - 1);
    return function (engine) {
      return clone[distribution(engine)];
    };
  };

  Random.shuffle = function (engine, array, downTo) {
    var length = array.length;
    if (length) {
      if (downTo == null) {
        downTo = 0;
      }
      for (var i = (length - 1) >>> 0; i > downTo; --i) {
        var distribution = Random.integer(0, i);
        var j = distribution(engine);
        if (i !== j) {
          var tmp = array[i];
          array[i] = array[j];
          array[j] = tmp;
        }
      }
    }
    return array;
  };
  proto.shuffle = function (array) {
    return Random.shuffle(this.engine, array);
  };

  Random.sample = function (engine, population, sampleSize) {
    if (sampleSize < 0 || sampleSize > population.length || !isFinite(sampleSize)) {
      throw new RangeError("Expected sampleSize to be within 0 and the length of the population");
    }

    if (sampleSize === 0) {
      return [];
    }

    var clone = slice.call(population);
    var length = clone.length;
    if (length === sampleSize) {
      return Random.shuffle(engine, clone, 0);
    }
    var tailLength = length - sampleSize;
    return Random.shuffle(engine, clone, tailLength - 1).slice(tailLength);
  };
  proto.sample = function (population, sampleSize) {
    return Random.sample(this.engine, population, sampleSize);
  };

  Random.die = function (sideCount) {
    return Random.integer(1, sideCount);
  };
  proto.die = function (sideCount) {
    return Random.die(sideCount)(this.engine);
  };

  Random.dice = function (sideCount, dieCount) {
    var distribution = Random.die(sideCount);
    return function (engine) {
      var result = [];
      result.length = dieCount;
      for (var i = 0; i < dieCount; ++i) {
        result[i] = distribution(engine);
      }
      return result;
    };
  };
  proto.dice = function (sideCount, dieCount) {
    return Random.dice(sideCount, dieCount)(this.engine);
  };

  // http://en.wikipedia.org/wiki/Universally_unique_identifier
  Random.uuid4 = (function () {
    function zeroPad(string, zeroCount) {
      return stringRepeat("0", zeroCount - string.length) + string;
    }

    return function (engine) {
      var a = engine() >>> 0;
      var b = engine() | 0;
      var c = engine() | 0;
      var d = engine() >>> 0;

      return (
        zeroPad(a.toString(16), 8) +
        "-" +
        zeroPad((b & 0xffff).toString(16), 4) +
        "-" +
        zeroPad((((b >> 4) & 0x0fff) | 0x4000).toString(16), 4) +
        "-" +
        zeroPad(((c & 0x3fff) | 0x8000).toString(16), 4) +
        "-" +
        zeroPad(((c >> 4) & 0xffff).toString(16), 4) +
        zeroPad(d.toString(16), 8));
    };
  }());
  proto.uuid4 = function () {
    return Random.uuid4(this.engine);
  };

  Random.string = (function () {
    // has 2**x chars, for faster uniform distribution
    var DEFAULT_STRING_POOL = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";

    return function (pool) {
      if (pool == null) {
        pool = DEFAULT_STRING_POOL;
      }

      var length = pool.length;
      if (!length) {
        throw new Error("Expected pool not to be an empty string");
      }

      var distribution = Random.integer(0, length - 1);
      return function (engine, length) {
        var result = "";
        for (var i = 0; i < length; ++i) {
          var j = distribution(engine);
          result += pool.charAt(j);
        }
        return result;
      };
    };
  }());
  proto.string = function (length, pool) {
    return Random.string(pool)(this.engine, length);
  };

  Random.hex = (function () {
    var LOWER_HEX_POOL = "0123456789abcdef";
    var lowerHex = Random.string(LOWER_HEX_POOL);
    var upperHex = Random.string(LOWER_HEX_POOL.toUpperCase());

    return function (upper) {
      if (upper) {
        return upperHex;
      } else {
        return lowerHex;
      }
    };
  }());
  proto.hex = function (length, upper) {
    return Random.hex(upper)(this.engine, length);
  };

  Random.date = function (start, end) {
    if (!(start instanceof Date)) {
      throw new TypeError("Expected start to be a Date, got " + typeof start);
    } else if (!(end instanceof Date)) {
      throw new TypeError("Expected end to be a Date, got " + typeof end);
    }
    var distribution = Random.integer(start.getTime(), end.getTime());
    return function (engine) {
      return new Date(distribution(engine));
    };
  };
  proto.date = function (start, end) {
    return Random.date(start, end)(this.engine);
  };

  if (typeof define === "function" && define.amd) {
    define(function () {
      return Random;
    });
  } else if (typeof module !== "undefined" && typeof require === "function") {
    module.exports = Random;
  } else {
    (function () {
      var oldGlobal = root[GLOBAL_KEY];
      Random.noConflict = function () {
        root[GLOBAL_KEY] = oldGlobal;
        return this;
      };
    }());
    root[GLOBAL_KEY] = Random;
  }
}(this));
},{}]},{},[5]);
