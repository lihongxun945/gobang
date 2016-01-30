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

},{"./role":6,"./score.js":7}],2:[function(require,module,exports){
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

},{"./evaluate-rows.js":2,"./flat":4,"./role":6}],4:[function(require,module,exports){
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
var e = require("./evaluate.js");
var S = require("./score.js");
var r = require("./role.js");
var win = require("./win.js");

var Board = function(container) {
  this.container = container;
  this.step = 300 / 14.4;
  this.offset = 14;


  var self = this;
  if(self.lock) return;
  this.container.on("click", function(e) {
    if(self.lock) return;
    var x = e.offsetX, y = e.offsetY;
    x = Math.floor((x+self.offset)/self.step) - 1;
    y = Math.floor((y+self.offset)/self.step) - 1;

    self.set(x, y, 1);
  });

  this.worker = new Worker("./dist/computer.js");

  this.worker.onmessage = function(e) {
    self._set(e.data[0], e.data[1], r.com);
    self.lock = false;
  }

  this.init();
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
  this.draw();
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

Board.prototype._set = function(x, y, role) {
  this.board[x][y] = role;
  this.draw();
  var value = e(this.board);
  var w = win(this.board);
  if(w == r.com) {
    alert("电脑赢了！");
    this.init();
  } else if (w == r.hum) {
    alert("你赢了！");
    this.init();
  }
}

Board.prototype.set = function(x, y, role) {
  if(this.board[x][y] !== 0) {
    throw new Error("此位置不为空");
  }
  this._set(x, y, role);
  this.lock = true;
  this.worker.postMessage({
    board: this.board,
    deep: 3
  });
}

var b = new Board($("#board"));

},{"./evaluate.js":3,"./role.js":6,"./score.js":7,"./win.js":8}],6:[function(require,module,exports){
module.exports = {
  com: 2,
  hum: 1,
  empty: 0
}

},{}],7:[function(require,module,exports){
module.exports = {
  ONE: 10,
  TWO: 100,
  THREE: 1000,
  FOUR: 10000,
  FIVE: 1000000,
  BLOCKED_ONE: 1,
  BLOCKED_TWO: 10,
  BLOCKED_THREE: 100,
  BLOCKED_FOUR: 1000
}

},{}],8:[function(require,module,exports){
var flat = require("./flat.js");
var eRow = require("./evaluate-row.js");
var r = require("./role");
var S = require("./score.js");

module.exports = function(board) {
  var rows = flat(board);

  for(var i=0;i<rows.length;i++) {
    var value = eRow(rows[i], r.com);
    if(value >= S.FIVE) {
      return r.com;
    } 
    value = eRow(rows[i], r.hum);
    if (value >= S.FIVE) {
      return r.hum;
    }
  }
  return r.empty;
}

},{"./evaluate-row.js":1,"./flat.js":4,"./role":6,"./score.js":7}]},{},[5]);
