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

  this.worker = new Worker("./dist/bridge.js");

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
