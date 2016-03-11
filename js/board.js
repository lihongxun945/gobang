var scorePoint = require("./evaluate-point.js");
var zobrist = require("./zobrist.js");
var hasNeighbor = require("./neighbor.js");
var R = require("./role.js");
var S = require("./score.js");

var Board = function() {
}

Board.prototype.init = function(sizeOrBoard) {
  this.steps = [];
  if(sizeOrBoard.length) {
    this.board = sizeOrBoard;
  } else {
    this.board = [];
    for(var i=0;i<sizeOrBoard;i++) {
      var row = [];
      for(var j=0;j<sizeOrBoard;j++) {
        row.push(0);
      }
      this.board.push(row);
    }
    this.board[7][7] = R.com;
    this.steps.push([7, 7]);
  }
  this.initScore();
  this.zobrist = zobrist;
  this.zobrist.go(7, 7, R.com);
}

Board.prototype.initScore = function() {

  this.comMaxScore = - S.FIVE;
  this.humMaxScore = - S.FIVE;

  var board = this.board;

  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == R.empty) {
        if(hasNeighbor(board, [i, j], 2, 2)) { //必须是有邻居的才行
          this.comMaxScore = Math.max(scorePoint(board, [i, j], R.com), this.comMaxScore);
          this.humMaxScore = Math.max(scorePoint(board, [i, j], R.hum), this.humMaxScore);
        }
      }
    }
  }
}

//只更新一个点附近的分数
Board.prototype.updateScore = function(p) {
  var radius = 8,
      board = this.board,
      len = this.board.length;

  // -
  for(var i=-radius;i<radius;i++) {
    var x = p[0], y = p[1]+i;
    if(y<0) continue;
    if(y>=len) break;
    if(board[x][y] !== R.empty) continue;
    this.comMaxScore = Math.max(scorePoint(this.board, [x, y], R.com), this.comMaxScore);
    this.humMaxScore = Math.max(scorePoint(this.board, [x, y], R.hum), this.humMaxScore);
  }

  // |
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1];
    if(x<0) continue;
    if(x>=len) break;
    if(board[x][y] !== R.empty) continue;
    this.comMaxScore = Math.max(scorePoint(this.board, [x, y], R.com), this.comMaxScore);
    this.humMaxScore = Math.max(scorePoint(this.board, [x, y], R.hum), this.humMaxScore);
  }

  // \
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1]+i;
    if(x<0 || y<0) continue;
    if(x>=len || y>=len) break;
    if(board[x][y] !== R.empty) continue;
    this.comMaxScore = Math.max(scorePoint(this.board, [x, y], R.com), this.comMaxScore);
    this.humMaxScore = Math.max(scorePoint(this.board, [x, y], R.hum), this.humMaxScore);
  }

  // /
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1]-i;
    if(x<0 || y<0) continue;
    if(x>=len || y>=len) continue;
    if(board[x][y] !== R.empty) continue;
    this.comMaxScore = Math.max(scorePoint(this.board, [x, y], R.com), this.comMaxScore);
    this.humMaxScore = Math.max(scorePoint(this.board, [x, y], R.hum), this.humMaxScore);
  }
}

//下子
Board.prototype.put = function(p, role, record) {
  this.board[p[0]][p[1]] = role;
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
  return (role == R.com ? 1 : -1) * (this.comMaxScore - this.humMaxScore);
}

//启发函数
Board.prototype.gen = function() {
}

var board = new Board();

module.exports = board;
