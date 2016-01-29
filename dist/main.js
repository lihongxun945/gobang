(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var r = require("./role");
var SCORE = require("./score.js");

var eRow = function(line, role) {
  var count = 0; // 连子数
  var block = 0; // 封闭数
  var value = 0;  //分数

  for(var i=0;i<line.length;i++) {
    if(line[i] == role) { // 发现第一个己方棋子
      count=1;
      block=0;
      if(i==0) block=1;
      else if(line[i-1] != r.empty) block = 1;
      for(i=i+1;i<line.length;i++) {
        if(line[i] == role) count ++
        else break;
      }
      if(i==line.length || line[i] != r.empty) block++;
      value += score(count, block);
    }
  }
  return value;
}

var score = function(count, block) {

  if(count >= 5) return SCORE.FIVE;

  if(block === 0) {
    switch(count) {
      case 1: return SCORE.ONE;
      case 2: return SCORE.TWO;
      case 3: return SCORE.THREE;
      case 4: return SCORE.FOUR;
    }
  }

  if(block === 1) {
    switch(count) {
      case 1: return SCORE.BLOCKED_ONE;
      case 2: return SCORE.BLOCKED_TWO;
      case 3: return SCORE.BLOCKED_THREE;
      case 4: return SCORE.BLOCKED_FOUR;
    }
  }

  return 0;
}

module.exports = eRow;

},{"./role":8,"./score.js":9}],2:[function(require,module,exports){
var eRow = require("./evaluate-row.js");

var eRows = function(rows, role) {
  var r = 0;
  for(var i=0;i<rows.length;i++) {
    r+=eRow(rows[i], role);
  }
  return r;
}

module.exports = eRows;

},{"./evaluate-row.js":1}],3:[function(require,module,exports){
var flat = require("./flat");
var r = require("./role");
var eRows = require("./evaluate-rows.js");

var evaluate = function(board) {
  var rows = flat(board);
  var humScore = eRows(rows, r.hum);
  var comScore = eRows(rows, r.com);

  return comScore - humScore;
}

module.exports = evaluate;

},{"./evaluate-rows.js":2,"./flat":4,"./role":8}],4:[function(require,module,exports){
//一维化，把二位的棋盘四个一位数组。
var flat = function(board) {
  var result = [];
  var len = board.length;

  //横向
  for(var i=0;i<len;i++) {
    result.push(board[i]);
  }


  //纵向
  for(var i=0;i<len;i++) {
    var col = [];
    for(var j=0;j<len;j++) {
      col.push(board[j][i]);
    }
    result.push(col);
  }


  // \/ 方向
  for(var i=0;i<len*2;i++) {
    var line = [];
    for(var j=0;j<=i && j<len;j++) {
      if(i-j<len) line.push(board[i-j][j]);
    }
    if(line.length) result.push(line);
  }


  // \\ 方向
  for(var i=-1*len+1;i<len;i++) {
    var line = [];
    for(var j=0;j<len;j++) {
      if(j+i>=0 && j+i<len) line.push(board[j+i][j]);
    }
    if(line.length) result.push(line);
  }

  
  return result;
}

module.exports = flat;

},{}],5:[function(require,module,exports){
var role = require("./role.js");

var gen = function(board) {
  var points = [];
  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == role.empty && hasNeighbor(board, [i, j])) {
        points.push([i, j]);
      }
    }
  }
  return points;
}

//简单的规则，如果周围有邻居就作为可选的位子
var hasNeighbor = function(board, point) {
  var len = board.length;
  for(var i=point[0]-2;i<=point[0]+2;i++) {
    if(i<0||i>=len) continue;
    for(var j=point[1]-2;j<=point[1]+2;j++) {
      if(j<0||j>=len) continue;
      if(i==point[0] && j==point[1]) continue;
      if(board[i][j] != role.empty) return true;
    }
  }
  return false;
}

module.exports = gen;

},{"./role.js":8}],6:[function(require,module,exports){
var m = require("./max-min.js");

var Board = function(container) {
  this.container = container;
  this.init();
  this.step = 300 / 14.4;

  this.offset = 14;
}

Board.prototype.init = function() {
  this.board = [];
  for(var i=0;i<15;i++) {
    var row = [];
    for(var j=0;j<15;j++) {
      row.push(0);
    }
    this.board.push(row);
  }
  var self = this;
  this.container.on("click", function(e) {
    var x = e.offsetX, y = e.offsetY;
    x = Math.floor((x+self.offset)/self.step) - 1;
    y = Math.floor((y+self.offset)/self.step) - 1;

    self.set(x, y, 1);
  });
}

Board.prototype.draw = function() {
  var container = this.container;
  var board = this.board;
  
  container.find(".chessman").remove();

  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] != 0) {
        var chessman = $("<div class='chessman'></div>").appendTo(container);
        if(board[i][j] == 2) chessman.addClass("black");
        chessman.css("left", this.offset + i*this.step);
        chessman.css("top", this.offset + j*this.step);
      }
    }
  }
}

Board.prototype.set = function(x, y, role) {
  if(this.board[x][y] !== 0) {
    throw new Error("此位置不为空");
  }
  this.board[x][y] = role;
  this.draw();
  var p = m(this.board);
  this.board[p[0]][p[1]] = 2;
  this.draw();
}

var b = new Board($("#board"));

},{"./max-min.js":7}],7:[function(require,module,exports){
var evaluate = require("./evaluate");
var gen = require("./gen");
var role = require("./role");
var SCORE = require("./score.js");

var MAX = 9999999;
var MIN = -1*MAX;

/*
 * max min search
 * white is max, black is min
 */
var maxmin = function(board, deep) {
  var best = MIN;
  var points = gen(board);
  var bestPoints = [];
  deep = deep === undefined ? 3 : deep;

  points.forEach(function(p) {
    board[p[0]][p[1]] = role.com;
    var v = min(board, deep-1, MIN, MAX);

    //console.log(v, p);
    //如果跟之前的一个好，则把当前位子加入待选位子
    if(v == best) {
      bestPoints.push(p);
    }
    //找到一个更好的分，就把以前存的位子全部清除
    if(v > best) {
      best = v;
      bestPoints = [];
      bestPoints.push(p);
    }
    board[p[0]][p[1]] = role.empty;
  });
  var result = bestPoints[Math.floor(bestPoints.length * Math.random())];
  return result;
}

var min = function(board, deep, alpha, beta) {
  var v = evaluate(board);
  if(deep <= 0 || v >= SCORE.FIVE || v <= -1 * SCORE.FIVE || alpha >= beta) {
    return v;
  }

  var best = MAX;
  var points = gen(board);

  points.forEach(function(p) {
    board[p[0]][p[1]] = role.hum;
    var v = max(board, deep-1, alpha, best < beta ? best : beta);
    if(v < best ) {
      best = v;
    }
    board[p[0]][p[1]] = role.empty;
  });
  return best ;
}


var max = function(board, deep, alpha, beta) {
  var v = evaluate(board);
  if(deep <= 0 || v >= SCORE.FIVE || v <= -1 * SCORE.FIVE || alpha >= beta) {
    return v;
  }

  var best = MIN;
  var points = gen(board);

  points.forEach(function(p) {
    board[p[0]][p[1]] = role.com;
    var v = min(board, deep-1, best > alpha ? best : alpha, beta);
    if(v > best) {
      best = v;
    }
    board[p[0]][p[1]] = role.empty;
  });
  return best;
}

module.exports = maxmin;

},{"./evaluate":3,"./gen":5,"./role":8,"./score.js":9}],8:[function(require,module,exports){
module.exports = {
  com: 2,
  hum: 1,
  empty: 0
}

},{}],9:[function(require,module,exports){
module.exports = {
  ONE: 10,
  TWO: 100,
  THREE: 1000,
  FOUR: 10000,
  FIVE: 100000,
  BLOCKED_ONE: 1,
  BLOCKED_TWO: 10/2,
  BLOCKED_THREE: 100/2,
  BLOCKED_FOUR: 1000/2
}

},{}]},{},[6]);
