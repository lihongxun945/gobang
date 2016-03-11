var scorePoint = require("./evaluate-point.js");
var zobrist = require("./zobrist.js");
var hasNeighbor = require("./neighbor.js");
var R = require("./role.js");
var S = require("./score.js");
var config = require("./config.js");

var Board = function() {
}

Board.prototype.init = function(sizeOrBoard) {
  this.steps = [];
  this.zobrist = zobrist;
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
    this.board[7][7] = R.com;
    this.steps.push([7, 7]);
    this.zobrist.go(7, 7, R.com);
  }


  this.comScore = [];
  this.humScore = [];

  for(var i=0;i<size;i++) {
    var row1 = [], row2=[];
    for(var j=0;j<size;j++) {
      row1.push(0);
      row2.push(0);
    }
    this.comScore.push(row1);
    this.humScore.push(row2);
  }

  this.initScore();
  
}

Board.prototype.initScore = function() {

  this.comMaxScore = - S.FIVE;
  this.humMaxScore = - S.FIVE;

  var board = this.board;

  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == R.empty) {
        if(hasNeighbor(board, [i, j], 2, 2)) { //必须是有邻居的才行
          var cs = scorePoint(board, [i, j], R.com);
          var hs = scorePoint(board, [i, j], R.hum);
          this.comScore[i][j] = cs;
          this.humScore[i][j] = hs;
          this.comMaxScore = Math.max(cs, this.comMaxScore);
          this.humMaxScore = Math.max(hs, this.humMaxScore);
        }
      }
    }
  }
}

//只更新一个点附近的分数
Board.prototype.updateScore = function(p) {
  var radius = 8,
      board = this.board,
      self = this,
      len = this.board.length;

  function update(x, y) {
    var cs = scorePoint(board, [x, y], R.com);
    var hs = scorePoint(board, [x, y], R.hum);
    self.comScore[x][y] = cs;
    self.humScore[x][y] = hs;
    self.comMaxScore = Math.max(cs, self.comMaxScore);
    self.humMaxScore = Math.max(hs, self.humMaxScore);
  }
  // -
  for(var i=-radius;i<radius;i++) {
    var x = p[0], y = p[1]+i;
    if(y<0) continue;
    if(y>=len) break;
    if(board[x][y] !== R.empty) continue;
    update(x, y);
  }

  // |
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1];
    if(x<0) continue;
    if(x>=len) break;
    if(board[x][y] !== R.empty) continue;
    update(x, y);
  }

  // \
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1]+i;
    if(x<0 || y<0) continue;
    if(x>=len || y>=len) break;
    if(board[x][y] !== R.empty) continue;
    update(x, y);
  }

  // /
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1]-i;
    if(x<0 || y<0) continue;
    if(x>=len || y>=len) continue;
    if(board[x][y] !== R.empty) continue;
    update(x, y);
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
  var fives = [];
  var fours=[];
  var twothrees=[];
  var threes = [];
  var twos = [];
  var neighbors = [];

  var board = this.board;

  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == R.empty) {
        if(hasNeighbor(board, [i, j], 2, 2)) { //必须是有邻居的才行
          var scoreHum = this.humScore[i][j];
          var scoreCom = this.comScore[i][j];

          if(scoreCom >= S.FIVE) {//先看电脑能不能连成5
            return [[i, j]];
          } else if(scoreHum >= S.FIVE) {//再看玩家能不能连成5
            //别急着返回，因为遍历还没完成，说不定电脑自己能成五。
            fives.push([i, j]);
          } else if(scoreCom >= S.FOUR) {
            fours.unshift([i,j]);
          } else if(scoreHum >= S.FOUR) {
            fours.push([i,j]);
          } else if(scoreCom >= 2*S.THREE) {
            //能成双三也行
            twothrees.unshift([i,j]);
          } else if(scoreHum >= 2*S.THREE) {
            twothrees.push([i,j]);
          } else if(scoreCom >= S.THREE) {
            threes.unshift([i, j]);
          } else if(scoreHum >= S.THREE) {
            threes.push([i, j]);
          } else if(scoreCom >= S.TWO) {
            twos.unshift([i, j]);
          } else if(scoreHum >= S.TWO) {
            twos.push([i, j]);
          } else {
            neighbors.push([i, j]);
          }
        }
      }
    }
  }

  //如果成五，是必杀棋，直接返回
  if(fives.length) return [fives[0]];
  
  //注意，只要返回第一个即可，如果双方都有活四，则第一个是自己的
  if(fours.length) return [fours[0]];

  //双三很特殊，因为能形成双三的不一定比一个活三强
  if(twothrees.length) {
    return twothrees.concat(threes);
  }

  var result = threes.concat(
      twos.concat(
        neighbors
      )
    );

  if(result.length>config.countLimit) {
    return result.slice(0, config.countLimit);
  }

  return result;
}

var board = new Board();

module.exports = board;
