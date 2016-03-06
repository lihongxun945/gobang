var m = require("./negamax.js");
var R = require("./role.js");

var AI = function() {
  this.steps = [];
}

AI.prototype.start = function(size) {
  this.board = [];
  for(var i=0;i<size;i++) {
    var row = [];
    for(var j=0;j<size;j++) {
      row.push(0);
    }
    this.board.push(row);
  }
  this.board[7][7] = R.com;
  this.steps.push([7, 7]);
}

AI.prototype.set = function(x, y) {
  this.board[x][y] = R.hum;
  this.steps.push([x,y]);
  var p = m(this.board, 4);
  this.board[p[0]][p[1]] = R.com;
  this.steps.push(p);
  return p;
}

AI.prototype.back = function(step) {
  step = step || 1;
  while(step && this.steps.length >= 2) {
    var s = this.steps.pop();
    this.board[s[0]][s[1]] = R.empty;
    s = this.steps.pop();
    this.board[s[0]][s[1]] = R.empty;
    step --;
  }
}
module.exports = AI;
