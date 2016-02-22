(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var SCORE = require("./score.js");

var score = function(count, block, empty) {


  if(empty == 0) {
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

  } else {
    //中间有一个空位，这种情况下只考虑二，三，四
    //有一个空位的四连其实和三连是一样的分数
    if(block === 0) {
      switch(count) {
        case 2: return SCORE.TWO;
        case 3:
        case 4: return SCORE.THREE;
      }
    }

    if(block === 1) {
      switch(count) {
        case 2: return SCORE.BLOCKED_TWO;
        case 3:
        case 4: return SCORE.BLOCKED_THREE;
      }
    }
  }

  return 0;
}

module.exports = score;

},{"./score.js":8}],2:[function(require,module,exports){
var r = require("./role");
var SCORE = require("./score.js");
var score = require("./count-to-score.js");


var eRow = function(line, role) {
  var count = 0; // 连子数
  var block = 0; // 封闭数
  var empty = 0;  //空位数
  var value = 0;  //分数

  for(var i=0;i<line.length;i++) {
    if(line[i] == role) { // 发现第一个己方棋子
      count=1;
      block=0;
      empty=0;

      //判断左边界
      if(i==0) block=1;
      else if(line[i-1] != r.empty) block = 1;

      //计算己方棋子数
      for(i=i+1;i<line.length;i++) {
        if(line[i] == role) count ++;
        else if( count < 4 && i < line.length-1 && line[i] == r.empty && line[i+1] == role) empty++;  //只计算中间的一个空位，也就是己方棋子之间的一个空位。而且只有己方棋子少于4个才计算空位
        else break;
      }

      //判断右边界
      if(i==line.length || line[i] != r.empty) block++;
      value += score(count, block, empty);
    }
  }

  return value;
}

module.exports = eRow;

},{"./count-to-score.js":1,"./role":7,"./score.js":8}],3:[function(require,module,exports){
var eRow = require("./evaluate-row.js");

var eRows = function(rows, role) {
  var r = 0;
  for(var i=0;i<rows.length;i++) {
    r+=eRow(rows[i], role);
  }
  return r;
}

module.exports = eRows;

},{"./evaluate-row.js":2}],4:[function(require,module,exports){
var flat = require("./flat");
var R = require("./role");
var eRows = require("./evaluate-rows.js");

var evaluate = function(board) {
  var rows = flat(board);
  var humScore = eRows(rows, R.hum);
  var comScore = eRows(rows, R.com);

  return comScore - humScore;
}

module.exports = evaluate;

},{"./evaluate-rows.js":3,"./flat":5,"./role":7}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
var e = require("./evaluate.js");
var S = require("./score.js");
var R = require("./role.js");
var win = require("./win.js");

var Board = function(container, status) {
  this.container = container;
  this.status = status;
  this.step = this.container.width() * 0.065;
  this.offset = this.container.width() * 0.044;
  this.steps = [];  //存储

  this.started = false;


  var self = this;
  this.container.on("click", function(e) {
    if(self.lock || !self.started) return;
    var y = e.offsetX, x = e.offsetY;
    x = Math.floor((x+self.offset)/self.step) - 1;
    y = Math.floor((y+self.offset)/self.step) - 1;

    self.set(x, y, 1);
  });

  this.worker = new Worker("./dist/computer.js");

  this.worker.onmessage = function(e) {
    self._set(e.data[0], e.data[1], R.com);
    self.lock = false;
    self.setStatus("电脑下子("+e.data[0]+","+e.data[1]+"), 用时"+((new Date() - self.time)/1000)+"秒");
  }
  this.setStatus("请点击开始按钮");

}

Board.prototype.start = function() {

  if(this.started) return;
  this.initBoard();
  
  this.board[7][7] = R.com;
  this.steps.push([7, 7]);

  this.draw();

  this.setStatus("欢迎加入五子棋游戏");

  this.started = true;
}

Board.prototype.stop = function() {
  if(!this.started) return;
  this.setStatus("请点击开始按钮");
  this.started = false;
}
Board.prototype.initBoard = function() {
  this.board = [];
  for(var i=0;i<15;i++) {
    var row = [];
    for(var j=0;j<15;j++) {
      row.push(0);
    }
    this.board.push(row);
  }
  this.steps = [];
}

Board.prototype.draw = function() {
  var container = this.container;
  var board = this.board;
  
  container.find(".chessman, .indicator").remove();

  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] != 0) {
        var chessman = $("<div class='chessman'></div>").appendTo(container);
        if(board[i][j] == 2) chessman.addClass("black");
        chessman.css("top", this.offset + i*this.step);
        chessman.css("left", this.offset + j*this.step);
      }
    }
  }

  if(this.steps.length > 0) {
    var lastStep = this.steps[this.steps.length-1];
    $("<div class='indicator'></div>")
      .appendTo(container)
      .css("top", this.offset + this.step * lastStep[0])
      .css("left", this.offset + this.step * lastStep[1])
  }

}

Board.prototype._set = function(x, y, role) {
  this.board[x][y] = role;
  this.steps.push([x,y]);
  this.draw();
  var value = e(this.board);
  var w = win(this.board);
  var self = this;
  if(w == R.com) {
    $.alert("电脑赢了！", function() {
      self.stop();
    });
  } else if (w == R.hum) {
    $.alert("恭喜你赢了！", function() {
      self.stop();
    });
  }
}

Board.prototype.set = function(x, y, role) {
  if(this.board[x][y] !== 0) {
    throw new Error("此位置不为空");
  }
  this._set(x, y, role);
  this.com();
}

Board.prototype.com = function(x, y, role) {
  this.lock = true;
  this.time = new Date();
  this.worker.postMessage({
    board: this.board
  });
  this.setStatus("电脑正在思考...");
}

Board.prototype.setStatus = function(s) {
  this.status.text(s);
}

Board.prototype.back = function(step) {
  if(this.lock) {
    this.setStatus("电脑正在思考，请稍等..");
    return;
  }
  step = step || 1;
  while(step && this.steps.length >= 2) {
    var s = this.steps.pop();
    this.board[s[0]][s[1]] = R.empty;
    s = this.steps.pop();
    this.board[s[0]][s[1]] = R.empty;
    step --;
  }
  this.draw();
}


var b = new Board($("#board"), $(".status"));
$("#start").click(function() {
  b.start();
});

$("#fail").click(function() {
  $.confirm("确定认输吗?", function() {
    b.stop();
  });
});

$("#back").click(function() {
  b.back();
});

},{"./evaluate.js":4,"./role.js":7,"./score.js":8,"./win.js":9}],7:[function(require,module,exports){
module.exports = {
  com: 2,
  hum: 1,
  empty: 0
}

},{}],8:[function(require,module,exports){
module.exports = {
  ONE: 10,
  TWO: 100,
  THREE: 1000,
  FOUR: 10000,
  FIVE: 100000,
  BLOCKED_ONE: 1,
  BLOCKED_TWO: 10,
  BLOCKED_THREE: 100,
  BLOCKED_FOUR: 1000
}

},{}],9:[function(require,module,exports){
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

},{"./evaluate-row.js":2,"./flat.js":5,"./role":7,"./score.js":8}]},{},[6]);
