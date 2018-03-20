var scorePoint = require("./evaluate-point.js");
var zobrist = require("./zobrist.js");
var R = require("./role.js");
var S = require("./score.js");
var config = require("./config.js");
var array = require("./arrary.js");

var Board = function() {
}

Board.prototype.init = function(sizeOrBoard) {
  this.evaluateCache = {};
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
    //注意下面这样写是错的！因为很可能最高分已经没了，不是总是取最高分的，这样分数会越来越高的。所以改成每次遍历计算
    /*self.comMaxScore = Math.max(cs, self.comMaxScore);
    self.humMaxScore = Math.max(hs, self.humMaxScore);*/
  }
  // -
  for(var i=-radius;i<radius;i++) {
    var x = p[0], y = p[1]+i;
    if(y<0) continue;
    if(y>=len) break;
    if(board[x][y] !== R.empty) continue;
    update(x, y, 0);
  }

  // |
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1];
    if(x<0) continue;
    if(x>=len) break;
    if(board[x][y] !== R.empty) continue;
    update(x, y, 1);
  }

  // \
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1]+i;
    if(x<0 || y<0) continue;
    if(x>=len || y>=len) break;
    if(board[x][y] !== R.empty) continue;
    update(x, y, 2);
  }

  // /
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1]-i;
    if(x<0 || y<0) continue;
    if(x>=len || y>=len) continue;
    if(board[x][y] !== R.empty) continue;
    update(x, y, 3);
  }


  //通过遍历来计算最高分
}

//下子
Board.prototype.put = function(p, role, record) {
  this.board[p[0]][p[1]] = role;
  this.zobrist.go(p[0], p[1], role);
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

//棋面估分
//这里只算当前分，而不是在空位下一步之后的分
Board.prototype.evaluate = function(role) {

  //这里加了缓存，但是并没有提升速度
  if(config.cache && this.evaluateCache[this.zobrist.code]) return this.evaluateCache[this.zobrist.code];

  this.comMaxScore = - S.FIVE;
  this.humMaxScore = - S.FIVE;

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
  var result = (role == R.com ? 1 : -1) * (this.comMaxScore - this.humMaxScore);
  this.evaluateCache[this.zobrist.code] = result;

  return result;

}

//启发函数
Board.prototype.gen = function(limit) {
  var fives = [];
  var fours=[];
  var blockedfours = [];
  var twothrees=[];
  var threes = [];
  var twos = [];
  var neighbors = [];

  var board = this.board;

  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == R.empty) {
        var neighbor = [2,2];
        if(this.steps.length < 6) neighbor = [1, 1];
        if(this.hasNeighbor([i, j], neighbor[0], neighbor[1])) { //必须是有邻居的才行
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
          } else if(scoreCom >= S.BLOCKED_FOUR) {
            blockedfours.unshift([i,j]);
          } else if(scoreHum >= S.BLOCKED_FOUR) {
            blockedfours.push([i,j]);
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
  
  //注意一个活三可以有两个位置形成活四，但是不能只考虑其中一个，要从多个中考虑更好的选择
  //所以不能碰到活四就返回第一个，应该需要考虑多个
  if(fours.length) return fours;

  //冲四活三
  if(blockedfours.length) return [blockedfours[0]];

  //双三很特殊，因为能形成双三的不一定比一个活三强
  if(twothrees.length) {
    return twothrees.concat(threes);
  }

  var result = threes.concat(
      twos.concat(
        neighbors
      )
    );

  //这种分数低的，就不用全部计算了
  if(result.length>config.countLimit) {
    return result.slice(0, config.countLimit);
  }

  return limit ? result.slice(0, limit) : result;
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

var board = new Board();

module.exports = board;
