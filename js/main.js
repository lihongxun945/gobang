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
  this.board[4][7] = r.hum;
  this.board[5][7] = r.hum;
  this.board[6][7] = r.hum;

  this.board[4][9] = r.com;
  this.board[5][9] = r.com;

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
  this.com();
}

Board.prototype.com = function(x, y, role) {
  this.lock = true;
  this.worker.postMessage({
    board: this.board,
    deep: 3
  });
}

var b = new Board($("#board"));

b.com();
