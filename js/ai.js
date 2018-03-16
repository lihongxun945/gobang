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
