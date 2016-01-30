(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var m = require("./max-min.js");

onmessage = function(e) {
  var p = m(e.data.board, e.data.deep);
  postMessage(p);
}

},{"./max-min.js":7}],2:[function(require,module,exports){
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

},{"./role":8,"./score.js":10}],3:[function(require,module,exports){
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
var r = require("./role");
var eRows = require("./evaluate-rows.js");

var evaluate = function(board) {
  var rows = flat(board);
  var humScore = eRows(rows, r.hum);
  var comScore = eRows(rows, r.com);

  return comScore - humScore;
}

module.exports = evaluate;

},{"./evaluate-rows.js":3,"./flat":5,"./role":8}],5:[function(require,module,exports){
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
/*
 * 产生待选的节点
 * 这个函数的优化非常重要，这个函数产生的节点数，实际就是搜索总数的底数。比如这里平均产生50个节点，进行4层搜索，则平均搜索节点数为50的4次方（在没有剪枝的情况下）
 * 如果能减少产生的节点数，那么能指数级减少搜索时间
 * 如果能对返回的节点排序，先返回优先级高的节点。那么能极大提升剪枝效率，从而缩短计算时间。
 * 目前优化方式：
 * 1. 优先级排序，按估值进行排序
 * 2. 当搜索最后两层的时候，只搜索有相邻邻居的节点
 */

var role = require("./role.js");
var scorePoint = require("./score-point.js");
var score = require("./score.js");

var gen = function(board, deep) {
  
  var fours = [];
  var threes = [];
  var twos = [];
  var neighbors = [];
  var nextNeighbors = [];
  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == role.empty) {
        if(hasNeighbor(board, [i, j], 1, 1)) {
          var _s = scorePoint(board, [i,j]);
          if(_s >= score.FIVE) {
            return [[i, j]];
          } else if(_s >= score.FOUR) {
            fours.push([i, j]);
          } else if(_s >= score.THREE) {
            threes.push([i, j]);
          } else if(_s >= score.TWO) {
            twos.push([i, j]);
          } else {
            neighbors.push([i, j]);
          }
        } else if(deep >= 2 && hasNeighbor(board, [i, j], 2, 2)) {
          nextNeighbors.push([i, j]);
        }
      }
    }
  }
  return fours.concat(
            threes.concat(
              twos.concat(
                neighbors.concat(nextNeighbors)
              )
            )
  );
}

//有邻居
var hasNeighbor = function(board, point, distance, count) {
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
      if(board[i][j] != role.empty) {
        count --;
        if(count <= 0) return true;
      }
    }
  }
  return false;
}


module.exports = gen;

},{"./role.js":8,"./score-point.js":9,"./score.js":10}],7:[function(require,module,exports){
var evaluate = require("./evaluate");
var gen = require("./gen");
var role = require("./role");
var SCORE = require("./score.js");
var win = require("./win.js");

var MAX = SCORE.FIVE*10;
var MIN = -1*MAX;

var total,  //总节点数
    cut;  //剪枝掉的节点数

/*
 * max min search
 * white is max, black is min
 */
var maxmin = function(board, deep) {
  var best = MIN;
  var points = gen(board, deep);
  var bestPoints = [];
  deep = deep === undefined ? 4 : deep;

  total = 0;
  cut = 0;

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board[p[0]][p[1]] = role.com;
    var v = min(board, deep-1, MAX, best > MIN ? best : MIN);

    //console.log(v, p);
    //如果跟之前的一个好，则把当前位子加入待选位子
    if(v == best) {
      bestPoints.push(p);
    }
    //找到一个更好的分，就把以前存的位子全部清除
    if(v > best) {
      best = v;
      bestPoints = [];
      bestPoints.push(p);
    }
    board[p[0]][p[1]] = role.empty;
  }
  var result = bestPoints[Math.floor(bestPoints.length * Math.random())];
  console.log('当前局面分数：' + best);
  console.log('搜索节点数:'+ total+ ' 剪枝掉的节点数:'+cut); //注意，减掉的节点数实际远远不止 cut 个，因为减掉的节点的子节点都没算进去。实际 4W个节点的时候，剪掉了大概 16W个节点
  return result;
}

var min = function(board, deep, alpha, beta) {
  var v = evaluate(board);
  total ++;
  if(deep <= 0 || win(board)) {
    return v;
  }

  var best = MAX;
  var points = gen(board, deep);

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board[p[0]][p[1]] = role.hum;
    var v = max(board, deep-1, best < alpha ? best : alpha, beta);
    board[p[0]][p[1]] = role.empty;
    if(v < best ) {
      best = v;
    }
    if(v < beta) {
      cut ++;
      break;
    }
  }
  return best ;
}


var max = function(board, deep, alpha, beta) {
  var v = evaluate(board);
  total ++;
  if(deep <= 0 || win(board)) {
    return v;
  }

  var best = MIN;
  var points = gen(board, deep);

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board[p[0]][p[1]] = role.com;
    var v = min(board, deep-1, alpha, best > beta ? best : beta);
    board[p[0]][p[1]] = role.empty;
    if(v > best) {
      best = v;
    }
    if(v > alpha) {
      cut ++;
      break;
    }
  }
  return best;
}

module.exports = maxmin;

},{"./evaluate":4,"./gen":6,"./role":8,"./score.js":10,"./win.js":11}],8:[function(require,module,exports){
module.exports = {
  com: 2,
  hum: 1,
  empty: 0
}

},{}],9:[function(require,module,exports){
/*
 * 启发式评价函数
 * 这个是专门给某一个空位打分的，不是给整个棋盘打分的
 */
var score = require("./score.js");
var role = require("./role.js");
var eRow = require("./evaluate-row.js");

var s = function(board, p) {
  var result = 0;
  var line = [];

  var len = board.length;

  //方便起见，不考虑边界

  if(p[0] == 0 || p[0] == len-1) return result;
  if(p[1] == 0 || p[1] == len-1) return result;


  line=[];
  for(var i=p[0]-4;i<=p[0]+4;i++) {//只截最近的一段。不然可能会把同一行的其他的分加上
    if(i<0 || i>=len) continue;
    line.push(board[p[0]][i]);
  }
  result += eRow(line, role.com);
  result += eRow(line, role.hum);


  line=[];
  for(var i=p[1]-4;i<=p[1]+4;i++) {
    if(i<0 || i>=len) continue;
    line.push(board[i][p[1]]);
  }
  result += eRow(line, role.com);
  result += eRow(line, role.hum);


  line=[];
  for(var i=-4;i<=4;i++) {
    var x=p[0]+i;
    var y=p[1]+i;
    if(x<0 || x>=len) continue;
    if(y<0 || y>=len) continue;
    line.push(board[x][y]);
  }
  result += eRow(line, role.com);
  result += eRow(line, role.hum);


  line=[];
  for(var i=-4;i<=4;i++) {
    var x=p[0]-i;
    var y=p[1]+i;
    if(x<0 || x>=len) continue;
    if(y<0 || y>=len) continue;
    line.push(board[x][y]);
  }
  result += eRow(line, role.com);
  result += eRow(line, role.hum);

  return result;

}

module.exports = s;

},{"./evaluate-row.js":2,"./role.js":8,"./score.js":10}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{"./evaluate-row.js":2,"./flat.js":5,"./role":8,"./score.js":10}]},{},[1]);
