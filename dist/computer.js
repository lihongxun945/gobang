(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var m = require("./max-min.js");

onmessage = function(e) {
  var p = m(e.data.board, e.data.deep);
  postMessage(p);
}

},{"./max-min.js":11}],2:[function(require,module,exports){
module.exports = {
  searchDeep: 4,  //搜索深度
  deepDecrease: .7, //每深入一层，同样的分数会打一个折扣
  checkmateDeep:  8,  //算杀深度
}

},{}],3:[function(require,module,exports){
var SCORE = require("./score.js");

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

module.exports = score;

},{"./score.js":13}],4:[function(require,module,exports){
/*
 * 启发式评价函数
 * 这个是专门给某一个空位打分的，不是给整个棋盘打分的
 * 并且是只给某一个角色打分
 */
var S = require("./score.js");
var R = require("./role.js");
var score = require("./count-to-score.js");

/*
 * 表示在当前位置下一个棋子后的分数
 */

var s = function(board, p, role) {
  var result = 0;
  var count = 0, block = 0;

  var len = board.length;

  //横向
  count = 1;  //默认把当前位置当做己方棋子。因为算的是当前下了一个己方棋子后的分数
  block = 0;

  for(var i=p[1]+1;true;i++) {
    if(i>=len) {
      block ++;
      break;
    }
    var t = board[p[0]][i];
    if(t === R.empty) {
      break;
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  for(var i=p[1]-1;true;i--) {
    if(i<0) {
      block ++;
      break;
    }
    var t = board[p[0]][i];
    if(t === R.empty) {
      break;
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  result += score(count, block);

  //纵向
  count = 1;
  block = 0;

  for(var i=p[0]+1;true;i++) {
    if(i>=len) {
      block ++;
      break;
    }
    var t = board[i][p[1]];
    if(t === R.empty) {
      break;
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  for(var i=p[0]-1;true;i--) {
    if(i<0) {
      block ++;
      break;
    }
    var t = board[i][p[1]];
    if(t === R.empty) {
      break;
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  result += score(count, block);


  // \\
  count = 1;
  block = 0;

  for(var i=1;true;i++) {
    var x = p[0]+i, y = p[1]+i;
    if(x>=len || y>=len) {
      block ++;
      break;
    }
    var t = board[x][y];
    if(t === R.empty) {
      break;
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  for(var i=1;true;i++) {
    var x = p[0]-i, y = p[1]-i;
    if(x<0||y<0) {
      block ++;
      break;
    }
    var t = board[x][y];
    if(t === R.empty) {
      break;
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  result += score(count, block);


  // \/
  count = 1;
  block = 0;

  for(var i=1; true;i++) {
    var x = p[0]+i, y = p[1]-i;
    if(x>=len || y>=len) {
      block ++;
      break;
    }
    var t = board[x][y];
    if(t === R.empty) {
      break;
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  for(var i=1;true;i++) {
    var x = p[0]-i, y = p[1]+i;
    if(x<0||y<0) {
      block ++;
      break;
    }
    var t = board[x][y];
    if(t === R.empty) {
      break;
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  result += score(count, block);

  return result;

}

module.exports = s;

},{"./count-to-score.js":3,"./role.js":12,"./score.js":13}],5:[function(require,module,exports){
var r = require("./role");
var SCORE = require("./score.js");
var score = require("./count-to-score.js");


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

module.exports = eRow;

},{"./count-to-score.js":3,"./role":12,"./score.js":13}],6:[function(require,module,exports){
var eRow = require("./evaluate-row.js");

var eRows = function(rows, role) {
  var r = 0;
  for(var i=0;i<rows.length;i++) {
    r+=eRow(rows[i], role);
  }
  return r;
}

module.exports = eRows;

},{"./evaluate-row.js":5}],7:[function(require,module,exports){
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

},{"./evaluate-rows.js":6,"./flat":8,"./role":12}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
/*
 * 产生待选的节点
 * 这个函数的优化非常重要，这个函数产生的节点数，实际就是搜索总数的底数。比如这里平均产生50个节点，进行4层搜索，则平均搜索节点数为50的4次方（在没有剪枝的情况下）
 * 如果能减少产生的节点数，那么能指数级减少搜索时间
 * 如果能对返回的节点排序，先返回优先级高的节点。那么能极大提升剪枝效率，从而缩短计算时间。
 * 目前优化方式：
 * 1. 优先级排序，按估值进行排序
 * 2. 当搜索最后两层的时候，只搜索有相邻邻居的节点
 */

var R = require("./role.js");
var scorePoint = require("./evaluate-point.js");
var S = require("./score.js");

var gen = function(board, deep) {
  
  var fives = [];
  var fours=[];
  var twothrees=[];
  var threes = [];
  var twos = [];
  var neighbors = [];
  var nextNeighbors = [];

  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == R.empty) {
        if(hasNeighbor(board, [i, j], 1, 1)) { //必须是有邻居的才行
          var scoreHum = scorePoint(board, [i,j], R.hum);
          var scoreCom= scorePoint(board, [i,j], R.com);

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
        } else if(deep >= 2 && hasNeighbor(board, [i, j], 2, 2)) {
          nextNeighbors.push([i, j]);
        }
      }
    }
  }

  //如果成五，是必杀棋，直接返回
  if(fives.length) return [fives[0]];
  
  if(fours.length) return fours;

  if(twothrees.length) return twothrees;

  return threes.concat(
      twos.concat(
        neighbors.concat(nextNeighbors)
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
      if(board[i][j] != R.empty) {
        count --;
        if(count <= 0) return true;
      }
    }
  }
  return false;
}


module.exports = gen;

},{"./evaluate-point.js":4,"./role.js":12,"./score.js":13}],10:[function(require,module,exports){
var threshold = 1.2;

module.exports = {
  greatThan: function(a, b) {
    return a > b * threshold;
  },
  greatOrEqualThan: function(a, b) {
    return a * threshold > b;
  },
  littleThan: function(a, b) {
    return a * threshold < b;
  },
  littleOrEqualThan: function(a, b) {
    return a < b * threshold;
  },
  equal: function(a, b) {
    return (a * threshold > b) && (a < b * threshold);
  }
}

},{}],11:[function(require,module,exports){
var evaluate = require("./evaluate");
var gen = require("./gen");
var R = require("./role");
var SCORE = require("./score.js");
var win = require("./win.js");
var math = require("./math.js");
var config = require("./config.js");

var MAX = SCORE.FIVE*10;
var MIN = -1*MAX;

var total=0, //总节点数
    steps=0,  //总步数
    count,  //每次思考的节点数
    ABcut  //AB剪枝次数

/*
 * max min search
 * white is max, black is min
 */
var maxmin = function(board, deep) {
  var best = MIN;
  var points = gen(board, deep);
  var bestPoints = [];
  deep = deep === undefined ? config.searchDeep : deep;

  count = 0;
  ABcut = 0;

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board[p[0]][p[1]] = R.com;
    var v = min(board, deep-1, MAX, best > MIN ? best : MIN);

    //console.log(v, p);
    //如果跟之前的一个好，则把当前位子加入待选位子
    if(math.equal(v, best)) {
      bestPoints.push(p);
    }
    //找到一个更好的分，就把以前存的位子全部清除
    if(math.greatThan(v, best)) {
      best = v;
      bestPoints = [];
      bestPoints.push(p);
    }
    board[p[0]][p[1]] = R.empty;
  }
  var result = bestPoints[Math.floor(bestPoints.length * Math.random())];
  steps ++;
  total += count;
  console.log('当前局面分数：' + best);
  console.log('搜索节点数:'+ count+ ',AB剪枝次数:'+ABcut); //注意，减掉的节点数实际远远不止 ABcut 个，因为减掉的节点的子节点都没算进去。实际 4W个节点的时候，剪掉了大概 16W个节点
  console.log('当前统计：总共'+ steps + '步, ' + total + '个节点, 平均每一步' + Math.round(total/steps) +'个节点');
  return result;
}

var min = function(board, deep, alpha, beta) {
  var v = evaluate(board);
  count ++;
  if(deep <= 0 || win(board)) {
    return v;
  }

  var best = MAX;
  var points = gen(board, deep);

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board[p[0]][p[1]] = R.hum;
    var v = max(board, deep-1, best < alpha ? best : alpha, beta) * config.deepDecrease;
    board[p[0]][p[1]] = R.empty;
    if(math.littleThan(v, best)) {
      best = v;
    }
    if(math.littleOrEqualThan(v, beta)) {  //AB剪枝
      ABcut ++;
      break;
    }
  }
  return best ;
}


var max = function(board, deep, alpha, beta) {
  var v = evaluate(board);
  count ++;
  if(deep <= 0 || win(board)) {
    return v;
  }

  var best = MIN;
  var points = gen(board, deep);

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board[p[0]][p[1]] = R.com;
    var v = min(board, deep-1, alpha, best > beta ? best : beta) * config.deepDecrease;
    board[p[0]][p[1]] = R.empty;
    if(math.greatThan(v, best)) {
      best = v;
    }
    if(math.greatOrEqualThan(v, alpha)) { //AB 剪枝
      ABcut ++;
      break;
    }
  }
  return best;
}

module.exports = maxmin;

},{"./config.js":2,"./evaluate":7,"./gen":9,"./math.js":10,"./role":12,"./score.js":13,"./win.js":14}],12:[function(require,module,exports){
module.exports = {
  com: 2,
  hum: 1,
  empty: 0
}

},{}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{"./evaluate-row.js":5,"./flat.js":8,"./role":12,"./score.js":13}]},{},[1]);
