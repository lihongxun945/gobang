var scorePoint = require("./evaluate-point.js");
var zobrist = require("./zobrist.js");
var R = require("./role.js");
var S = require("./score.js");
var config = require("./config.js");
var array = require("./arrary.js");

//冲四的分其实肯定比活三高，但是如果这样的话容易形成盲目冲四的问题，所以如果发现电脑有无意义的冲四，则将分数降低到和活三一样
//而对于冲四活三这种杀棋，则将分数提高。
var fixScore = function(type) {
  if(type < S.FOUR && type >= S.BLOCKED_FOUR) {

    if(type >= S.BLOCKED_FOUR && type < (S.BLOCKED_FOUR + S.THREE)) {
      //单独冲四，意义不大
      return S.THREE;
    } else if(type >= S.BLOCKED_FOUR + S.THREE && type < S.BLOCKED_FOUR * 2) {
      return S.FOUR;  //冲四活三，比双三分高，相当于自己形成活四
    } else {
      //双冲四 比活四分数也高
      return S.FOUR * 2;
    }
  }
  return type;
}

var Board = function() {
}

Board.prototype.init = function(sizeOrBoard) {
  this.evaluateCache = {};
  this.steps = [];
  this.allSteps = [];
  this.zobrist = zobrist;
  zobrist.init(); // 注意重新初始化
  this._last = [false, false]; // 记录最后一步
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
  }
  // 无论是不是空位 都需要更新
  // -
  for(var i=-radius;i<radius;i++) {
    var x = p[0], y = p[1]+i;
    if(y<0) continue;
    if(y>=len) break;
    update(x, y, 0);
  }

  // |
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1];
    if(x<0) continue;
    if(x>=len) break;
    update(x, y, 1);
  }

  // \
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1]+i;
    if(x<0 || y<0) continue;
    if(x>=len || y>=len) break;
    update(x, y, 2);
  }

  // /
  for(var i=-radius;i<radius;i++) {
    var x = p[0]+i, y = p[1]-i;
    if(x<0 || y<0) continue;
    if(x>=len || y>=len) continue;
    update(x, y, 3);
  }


}

//下子
Board.prototype.put = function(p, role, record) {
  this.board[p[0]][p[1]] = role;
  this.zobrist.go(p[0], p[1], role);
  if (record) this.steps.push(p);
  this.updateScore(p);
  this.allSteps.push(p);
}
// 最后一次下子位置
Board.prototype.last = function(role) {
  for(var i=this.allSteps.length-1;i>=0;i--) {
    var p = this.allSteps[i];
    if(this.board[p[0]][p[1]] === role) return p;
  }
  return false;
}

//移除棋子
Board.prototype.remove = function(p) {
  var r = this.board[p[0]][p[1]];
  this.zobrist.go(p[0], p[1], r);
  this.board[p[0]][p[1]] = R.empty;
  this.updateScore(p);
  this.allSteps.pop();
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


Board.prototype.logSteps = function() {
  console.log(this.allSteps.map((d) => '['+d[0]+','+d[1]+']').join(','))
}

//棋面估分
//这里只算当前分，而不是在空位下一步之后的分
Board.prototype.evaluate = function(role) {

  //这里加了缓存，但是并没有提升速度
  if(config.cache && this.evaluateCache[this.zobrist.code]) return this.evaluateCache[this.zobrist.code];

  // 这里都是用正整数初始化的，所以初始值是0
  this.comMaxScore = 0;
  this.humMaxScore = 0;

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
  this.comMaxScore = fixScore(this.comMaxScore);
  this.humMaxScore = fixScore(this.humMaxScore);
  var result = (role == R.com ? 1 : -1) * (this.comMaxScore - this.humMaxScore);
  if (config.cache) this.evaluateCache[this.zobrist.code] = result;

  return result;

}

//启发函数
/*
 * 变量starBread的用途是用来进行米子计算
 * 所谓米子计算，只是，如果第一步尝试了一个位置A，那么接下来尝试的位置有两种情况：
 * 1: 大于等于活三的位置
 * 2: 在A的米子位置上
 * 注意只有对小于活三的棋才进行starSpread优化
 */

/*
 * gen 函数的排序是非常重要的，因为好的排序能极大提升AB剪枝的效率。
 * 而对结果的排序，是要根据role来的
 */


Board.prototype.gen = function(role, starSpread) {
  var fives = [];
  var comfours=[];
  var humfours=[];
  var comblockedfours = [];
  var humblockedfours = [];
  var comtwothrees=[];
  var humtwothrees=[];
  var comthrees = [];
  var humthrees = [];
  var comtwos = [];
  var humtwos = [];
  var neighbors = [];

  var board = this.board;

  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      var p = [i, j];
      if(board[i][j] == R.empty) {
        var neighbor = [2,2];
        if(this.steps.length < 6) neighbor = [1, 1];
        if(this.hasNeighbor([i, j], neighbor[0], neighbor[1])) { //必须是有邻居的才行
          var scoreHum = p.scoreHum = this.humScore[i][j];
          var scoreCom = p.scoreCom = this.comScore[i][j];
          var maxScore = Math.max(scoreCom, scoreHum);
          p.score = maxScore

          // 结果分级
          if (maxScore >= S.THREE) {
            p.level = 1
          } else if (maxScore >= S.TWO) {
            p.level = 2
          } else {
            p.level = 3
          }

          if(scoreCom >= S.FIVE) {//先看电脑能不能连成5
            fives.push(p);
          } else if(scoreHum >= S.FIVE) {//再看玩家能不能连成5
            //别急着返回，因为遍历还没完成，说不定电脑自己能成五。
            fives.push(p);
          } else if(scoreCom >= S.FOUR) {
            comfours.push(p);
          } else if(scoreHum >= S.FOUR) {
            humfours.push(p);
          } else if(scoreCom >= S.BLOCKED_FOUR) {
            comblockedfours.push(p);
          } else if(scoreHum >= S.BLOCKED_FOUR) {
            humblockedfours.push(p);
          } else if(scoreCom >= 2*S.THREE) {
            //能成双三也行
            comtwothrees.push(p);
          } else if(scoreHum >= 2*S.THREE) {
            humtwothrees.push(p);
          } else if(scoreCom >= S.THREE) {
            comthrees.push(p);
          } else if(scoreHum >= S.THREE) {
            humthrees.push(p);
          } else if(scoreCom >= S.TWO) {
            if (!starSpread) comtwos.unshift(p);
            else if (starSpread && this.isStarSpread(p, this.last(R.com))) comtwos.unshift(p);
          } else if(scoreHum >= S.TWO) {
            if (!starSpread) humtwos.unshift(p);
            else if (starSpread && this.isStarSpread(p, this.last(R.hum))) humtwos.unshift(p);
          } else {
            if (!starSpread) neighbors.push(p);
            else if (starSpread && this.isStarSpread(p, this.last(R.hum))) neighbors.push(p);
          }
        }
      }
    }
  }

  //如果成五，是必杀棋，直接返回
  if(fives.length) return fives;
  
  // 自己能活四，则直接活四，不考虑冲四
  if (role === R.com && comfours.length) return comfours;
  if (role === R.hum && humfours.length) return humfours;

  // 对面有活四和冲四，自己连冲四都没有，则只考虑对面的活四，不考虑对面的冲四
  
  if (role === R.com && !comfours.length && !comblockedfours.length && humfours.length) return humfours;
  if (role === R.hum && !humfours.length && !humblockedfours.length && comfours.length) return comfours;

  // 对面有活四自己有冲四，则都考虑下
  
  var fours = role === R.com ? comfours.concat(humfours) : humfours.concat(comfours);
  var blockedfours = role === R.com ? comblockedfours.concat(humblockedfours) : humblockedfours.concat(comblockedfours);
  if (fours.length) return fours.concat(blockedfours);

  var result = [];
  if (role === R.com) {
    result = comblockedfours
      .concat(humblockedfours)
      .concat(comtwothrees)
      .concat(humtwothrees)
      .concat(comthrees)
      .concat(humthrees)
  }
  if (role === R.hum) {
    result = humblockedfours
      .concat(comblockedfours)
      .concat(humtwothrees)
      .concat(comtwothrees)
      .concat(humthrees)
      .concat(comthrees)
  }

  result.sort(function(a, b) { return b.score - a.score })

  //双三很特殊，因为能形成双三的不一定比一个活三强
  if(comtwothrees.length || humtwothrees.length) {
    return result;
  }

  var twos;
  if (role === R.com) twos = comtwos.concat(humtwos);
  else twos = humtwos.concat(comtwos);

  twos.sort(function(a, b) { return b.score - a.score });
;
  result = result.concat(twos.length ? twos : neighbors);

  //这种分数低的，就不用全部计算了
  if(result.length>config.countLimit) {
    return result.slice(0, config.countLimit);
  }

  return result;
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

// a点是否在b点的starSpread路线上
Board.prototype.isStarSpread = function (a, b) {
  if (!b) return true

  if (! ((a[0] === b[0] || a[1] === b[1] || (Math.abs(a[0]-b[0]) === Math.abs(a[1] - b[1]))) && Math.abs(a[0]-b[0]) <= 3 && Math.abs(a[1]-b[1]) <= 3)) return false;
  // 同一行
  if (a[0] === b[0]) {
    // a 在左边
    if (a[1] < b[1]) {
      var empty=0;
      for(var i=a[1]+1;i<b[1];i++) {
        if (this.board[a[0]][i] === R.reverse(this.board[b[0]][b[1]])) return false;
        if (this.board[a[0]][i] === 0) empty++;
      }
      return empty <= 1;
    }
    // a 在右边
    if (a[1] > b[1]) {
      var empty=0;
      for(var i=a[1]-1;i>b[1];i--) {
        if (this.board[a[0]][i] === R.reverse(this.board[b[0]][b[1]])) return false;
        if (this.board[a[0]][i] === 0) empty++;
      }
      return empty <= 1;
    }
  }
  // 同一列
  if (a[1] === b[1]) {
    // a 在上边
    if (a[0] < b[0]) {
      var empty=0;
      for(var i=a[0]+1;i<b[0];i++) {
        if (this.board[i][a[1]] === R.reverse(this.board[b[0]][b[1]])) return false;
        if (this.board[i][a[1]] === 0) empty++;
      }
      return empty <= 1;
    }
    // a 在下边
    if (a[0] > b[0]) {
      var empty=0;
      for(var i=a[0]-1;i<b[0];i--) {
        if (this.board[i][a[1]] === R.reverse(this.board[b[0]][b[1]])) return false;
        if (this.board[i][a[1]] === 0) empty++;
      }
      return empty <= 1;
    }
  }
  // a 在左上
  if (a[0] < b[0] && a[1] < b[1]) {
    var empty=0;
    for(var i=1;a[0]+i<b[0];i++) {
      if (this.board[a[0]+i][a[1]+i] === R.reverse(this.board[b[0]][b[1]])) return false;
      if (this.board[a[0]+i][a[1]+i] === 0) empty++;
    }
    return empty <= 1;
  }
  // a 在右下
  if (a[0] > b[0] && a[1] > b[1]) {
    var empty=0;
    for(var i=1;a[0]-i>b[0];i++) {
      if (this.board[a[0]-i][a[1]-i] === R.reverse(this.board[b[0]][b[1]])) return false;
      if (this.board[a[0]-i][a[1]-i] === 0) empty++;
    }
    return empty <= 1;
  }
  // a 在左下
  if (a[0] > b[0] && a[1] < b[1]) {
    var empty=0;
    for(var i=1;a[0]-i>b[0];i++) {
      if (this.board[a[0]-i][a[1]+i] === R.reverse(this.board[b[0]][b[1]])) return false;
      if (this.board[a[0]-i][a[1]+i] === 0) empty++;
    }
    return empty <= 1;
  }
  // a 在右上
  if (a[0] < b[0] && a[1] > b[1]) {
    var empty=0;
    for(var i=1;a[0]+i>b[0];i++) {
      if (this.board[a[0]+i][a[1]-i] === R.reverse(this.board[b[0]][b[1]])) return false;
      if (this.board[a[0]+i][a[1]-i] === 0) empty++;
    }
    return empty <= 1;
  }

  return false;
}

var board = new Board();

module.exports = board;
