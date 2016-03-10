(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * 棋型表示
 * 用一个6位数表示棋型，从高位到低位分别表示
 * 连五，活四，眠四，活三，活二/眠三，活一/眠二, 眠一
 */

module.exports = {
  ONE: 10,
  TWO: 100,
  THREE: 1000,
  FOUR: 100000,
  FIVE: 1000000,
  BLOCKED_ONE: 1,
  BLOCKED_TWO: 10,
  BLOCKED_THREE: 100,
  BLOCKED_FOUR: 10000
}

},{}],2:[function(require,module,exports){
var m = require("./negamax.js");
var R = require("./role.js");
var zobrist = require("./zobrist.js");
var config = require("./config.js");

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
  this.zobrist = zobrist;
  this.zobrist.go(7, 7, R.com);
}

AI.prototype.set = function(x, y) {
  this.board[x][y] = R.hum;
  this.zobrist.go(x, y, R.hum);
  this.steps.push([x,y]);
  var p = m(this.board, config.searchDeep, this.zobrist);
  this.board[p[0]][p[1]] = R.com;
  this.zobrist.go(p[0], p[1], R.com);
  this.steps.push(p);
  return p;
}

AI.prototype.back = function(step) {
  step = step || 1;
  while(step && this.steps.length >= 2) {
    var s = this.steps.pop();
    this.zobrist.go(s[0], s[1], this.board[s[0]][s[1]]);
    this.board[s[0]][s[1]] = R.empty;
    s = this.steps.pop();
    this.zobrist.go(s[0], s[1], this.board[s[0]][s[1]]);
    this.board[s[0]][s[1]] = R.empty;
    step --;
  }
}
module.exports = AI;

},{"./config.js":5,"./negamax.js":12,"./role.js":14,"./zobrist.js":17}],3:[function(require,module,exports){
var AI = require("./ai.js");

var ai = new AI();


onmessage = function(e) {
  var d = e.data;
  if(d.type == "START") {
    ai.start(15);
  } else if(d.type == "GO") {
    var p = ai.set(e.data.x, e.data.y);
    postMessage(p);
  } else if(d.type == "BACK") {
    ai.back();
  }
}

},{"./ai.js":2}],4:[function(require,module,exports){
/*
 * 算杀
 * 算杀的原理和极大极小值搜索是一样的
 * 不过算杀只考虑冲四活三这类对方必须防守的棋
 * 因此算杀的复杂度虽然是 M^N ，但是底数M特别小，可以算到16步以上的杀棋。
 */

/*
 * 基本思路
 * 电脑有活三或者冲四，认为是玩家必须防守的
 * 玩家防守的时候却不一定根据电脑的棋来走，而是选择走自己最好的棋，比如有可能是自己选择冲四
 */

var R = require("./role.js");
var hasNeighbor = require("./neighbor.js");
var scorePoint = require("./evaluate-point.js");
var S = require("./SCORE.js");
var config = require("./config.js");
var zobrist = require("./zobrist.js");
var debug = require("./debug.js");

var Cache = {};

var debugNodeCount = 0;

var MAX_SCORE = S.THREE;
var MIN_SCORE = S.FOUR;

var debugCheckmate = debug.checkmate = {
  cacheCount: 0,
  cacheGet: 0
}


//找到所有比目标分数大的位置
var findMax = function(board, role, score) {
  var result = [];
  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == R.empty) {
        var p = [i, j];
        if(hasNeighbor(board, p, 2, 1)) { //必须是有邻居的才行

          var s = scorePoint(board, p, role);
          p.score = s;
          if(s >= S.FIVE) {
            return [p];
          }
          if(s >= score) {
            result.push(p);
          }
        }
      }
    }
  }
  //注意对结果进行排序
  result.sort(function(a, b) {
    return b.score - a.score;
  });
  return result;
}


//找到所有比目标分数大的位置
var findMin = function(board, role, score) {
  var result = [];
  var fives = [];
  var fours = [];
  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == R.empty) {
        var p = [i, j];
        if(hasNeighbor(board, p, 2, 1)) { //必须是有邻居的才行

          var s1 = scorePoint(board, p, role);
          var s2 = scorePoint(board, p, R.reverse(role));
          if(s1 >= S.FIVE) {
            p.score = - s1;
            return [p];
          } 
          if(s1 >= S.FOUR) {
            p.score = -s1;
            fours.unshift(p);
            continue;
          }
          if(s2 >= S.FIVE) {
            p.score = s2;
            fives.push(p);
            continue;
          } 
          if(s2 >= S.FOUR) {
            p.score = s2;
            fours.push(p);
            continue;
          }

          if(s1 >= score || s2 >= score) {
            p = [i, j];
            p.score = s1;
            result.push(p);
          }
        }
      }
    }
  }
  if(fives.length) return [fives[0]];
  if(fours.length) return [fours[0]];
  //注意对结果进行排序
  result.sort(function(a, b) {
    return Math.abs(b.score) - Math.abs(a.score);
  });
  return result;
}

var max = function(board, role, deep) {
  debugNodeCount ++;
  if(deep <= 0) return false;

  if(config.cache) {
    var c = Cache[zobrist.code];
    if(c) {
      if(c.deep >= deep || c.result !== false) {
        debugCheckmate.cacheGet ++;
        return c.result;
      }
    }
  }

  var points = findMax(board, role, MAX_SCORE);
  if(points.length && points[0].score >= S.FOUR) return [points[0]]; //为了减少一层搜索，活四就行了。
  if(points.length == 0) return false;
  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board[p[0]][p[1]] = role;
    zobrist.go(p[0], p[1], role);
    var m = min(board, role, deep-1);
    zobrist.go(p[0], p[1], role);
    board[p[0]][p[1]] = R.empty;
    if(m) {
      if(m.length) {
        m.unshift(p); //注意 unshift 方法返回的是新数组长度，而不是新数组本身
        cache(deep, m);
        return m;
      } else {
        cache(deep, [p]);
        return [p];
      }
    }
  }
  cache(deep, false);
  return false;
}


//只要有一种方式能防守住，就可以了
var min = function(board, role, deep) {
  debugNodeCount ++;
  var w = win(board);
  if(w == role) return true;
  if(w == R.reverse(role)) return false;
  if(deep <= 0) return false;
  if(config.cache) {
    var c = Cache[zobrist.code];
    if(c){
      if(c.deep >= deep || c.result !== false) {
        debugCheckmate.cacheGet ++;
        return c.result;
      }
    }
  }
  var points = findMin(board, R.reverse(role), MIN_SCORE);
  if(points.length == 0) return false;
  if(points.length && -1 * points[0].score  >= S.FOUR) return false; //为了减少一层搜索，活四就行了。

  var cands = [];
  var currentRole = R.reverse(role);
  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board[p[0]][p[1]] = currentRole;
    zobrist.go(p[0], p[1], currentRole);
    var m = max(board, role, deep-1);
    zobrist.go(p[0], p[1], currentRole);
    board[p[0]][p[1]] = R.empty;
    if(m) {
      m.unshift(p);
      cands.push(m);
      cache(deep, m);
      continue;
    } else {
      cache(deep, false);
      return false; //只要有一种能防守住
    }
  }
  var result = cands[Math.floor(cands.length*Math.random())];  //无法防守住
  cache(deep, result);
  return result;
}

var cache = function(deep, result) {
  if(!config.cache) return;
  Cache[zobrist.code] = {
    deep: deep,
    result: result
  }
  debugCheckmate.cacheCount ++;
}

//迭代加深
var deeping = function(board, role, deep) {
  var start = new Date();
  debugNodeCount = 0;
  for(var i=1;i<=deep;i++) {
    var result = max(board, role, i);
    if(result) break; //找到一个就行
  }
  var time = Math.round(new Date() - start);
  if(result) console.log("算杀成功("+time+"毫秒, "+ debugNodeCount + "个节点):" + JSON.stringify(result));
  else {
    //console.log("算杀失败("+time+"毫秒)");
  }
  return result;
}

module.exports = function(board, role, deep, onlyFour) {
  return false;

  deep = deep || config.checkmateDeep;
  if(deep <= 0) return false;

  //先计算冲四赢的
  MAX_SCORE = S.FOUR;
  MIN_SCORE = S.FIVE;

  var result = deeping(board, role, deep);
  if(result) {
    result.score = S.FOUR;
    return result;
  }

  if(onlyFour) return false;  //只计算冲四

  //再计算通过 活三 赢的；
  MAX_SCORE = S.THREE;
  MIN_SCORE = S.FOUR;
  result = deeping(board, role, deep);
  if(result) {
    result.score = S.THREE*2; //虽然不如活四分数高，但是还是比活三分数要高的
  }

  return result;

}

},{"./SCORE.js":1,"./config.js":5,"./debug.js":7,"./evaluate-point.js":8,"./neighbor.js":13,"./role.js":14,"./zobrist.js":17}],5:[function(require,module,exports){
module.exports = {
  searchDeep: 4,  //搜索深度
  deepDecrease: .8, //按搜索深度递减分数，为了让短路径的结果比深路劲的分数高
  countLimit: 10, //gen函数返回的节点数量上限，超过之后将会按照分数进行截断
  checkmateDeep:  0,  //算杀深度
  cache: false,  //是否使用置换表
}

},{}],6:[function(require,module,exports){
var score = require("./score.js");

var t = function(count, block, empty) {

  if(empty === undefined) empty = 0;

  //没有空位
  if(empty == 0) {
    if(count >= 5) return score.FIVE;
    if(block === 0) {
      switch(count) {
        case 1: return score.ONE;
        case 2: return score.TWO;
        case 3: return score.THREE;
        case 4: return score.FOUR;
      }
    }

    if(block === 1) {
      switch(count) {
        case 1: return score.BLOCKED_ONE;
        case 2: return score.BLOCKED_TWO;
        case 3: return score.BLOCKED_THREE;
        case 4: return score.BLOCKED_FOUR;
      }
    }

  } else if(empty === 1 || empty == count-1) {
    //第1个是空位
    if(count >= 6) {
      return score.FIVE;
    }
    if(block === 0) {
      switch(count) {
        case 2: return score.TWO;
        case 3:
        case 4: return score.THREE;
        case 5: return score.FOUR;
      }
    }

    if(block === 1) {
      switch(count) {
        case 2: return score.BLOCKED_TWO;
        case 3: return score.BLOCKED_THREE;
        case 4: return score.BLOCKED_FOUR;
        case 5: return score.BLOCKED_FOUR;
      }
    }
  } else if(empty === 2 || empty == count-2) {
    //第二个是空位
    if(count >= 7) {
      return score.FIVE;
    }
    if(block === 0) {
      switch(count) {
        case 3:
        case 4:
        case 5: return score.THREE;
        case 6: return score.FOUR;
      }
    }

    if(block === 1) {
      switch(count) {
        case 3: return score.BLOCKED_THREE;
        case 4: return score.BLOCKED_FOUR;
        case 5: return score.BLOCKED_FOUR;
        case 6: return score.FOUR;
      }
    }

    if(block === 2) {
      switch(count) {
        case 4:
        case 5:
        case 6: return score.BLOCKED_FOUR;
      }
    }
  } else if(empty === 3 || empty == count-3) {
    if(count >= 8) {
      return score.FIVE;
    }
    if(block === 0) {
      switch(count) {
        case 4:
        case 5: return score.THREE;
        case 6: return score.THREE*2;
        case 7: return score.FOUR;
      }
    }

    if(block === 1) {
      switch(count) {
        case 4:
        case 5:
        case 6: return score.BLOCKED_FOUR;
        case 7: return score.FOUR;
      }
    }

    if(block === 2) {
      switch(count) {
        case 4:
        case 5:
        case 6:
        case 7: return score.BLOCKED_FOUR;
      }
    }
  } else if(empty === 4 || empty == count-4) {
    if(count >= 9) {
      return score.FIVE;
    }
    if(block === 0) {
      switch(count) {
        case 5:
        case 6:
        case 7:
        case 8: return score.FOUR;
      }
    }

    if(block === 1) {
      switch(count) {
        case 4:
        case 5:
        case 6:
        case 7: return score.BLOCKED_FOUR;
        case 8: return score.FOUR;
      }
    }

    if(block === 2) {
      switch(count) {
        case 5:
        case 6:
        case 7:
        case 8: return score.BLOCKED_FOUR;
      }
    }
  } else if(empty === 5 || empty == count-5) {
    return score.FIVE;
  }

  return 0;
}

module.exports = t;

},{"./score.js":15}],7:[function(require,module,exports){
var debug = {};
module.exports = debug;

},{}],8:[function(require,module,exports){
/*
 * 启发式评价函数
 * 这个是专门给某一个空位打分的，不是给整个棋盘打分的
 * 并且是只给某一个角色打分
 */
var R = require("./role.js");
var type = require("./count-to-type.js");
var typeToScore = require("./type-to-score.js");
/*
 * 表示在当前位置下一个棋子后的分数
 */

var s = function(board, p, role) {
  var result = 0;
  var count = 0, block = 0;

  var len = board.length;

  function reset() {
    count = 1;
    block = 0;
    empty = 0;
  }
  

  reset();

  for(var i=p[1]+1;true;i++) {
    if(i>=len) {
      block ++;
      break;
    }
    var t = board[p[0]][i];
    if(t === R.empty) {
      if(!empty && i<len-1 && board[p[0]][i+1] == role) {
        empty = count;
        continue;
      } else {
        break;
      }
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
      if(!empty && i>0 && board[p[0]][i-1] == role) {
        empty = count;
        continue;
      } else {
        break;
      }
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  result += type(count, block, empty);

  //纵向
  reset();

  for(var i=p[0]+1;true;i++) {
    if(i>=len) {
      block ++;
      break;
    }
    var t = board[i][p[1]];
    if(t === R.empty) {
      if(!empty && i<len-1 && board[i+1][p[1]] == role) {
        empty = count;
        continue;
      } else {
        break;
      }
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
      if(!empty && i>0 && board[i-1][p[1]] == role) {
        empty = count;
        continue;
      } else {
        break;
      }
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  result += type(count, block, empty);


  // \\
  reset();

  for(var i=1;true;i++) {
    var x = p[0]+i, y = p[1]+i;
    if(x>=len || y>=len) {
      block ++;
      break;
    }
    var t = board[x][y];
    if(t === R.empty) {
      if(!empty && (x<len-1 && y < len-1) && board[x+1][y+1] == role) {
        empty = count;
        continue;
      } else {
        break;
      }
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
      if(!empty && (x>0 && y>0) && board[x-1][y-1] == role) {
        empty = count;
        continue;
      } else {
        break;
      }
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  result += type(count, block, empty);


  // \/
  reset();

  for(var i=1; true;i++) {
    var x = p[0]+i, y = p[1]-i;
    if(x<0||y<0||x>=len||y>=len) {
      block ++;
      break;
    }
    var t = board[x][y];
    if(t === R.empty) {
      if(!empty && (x<len-1 && y<len-1) && board[x+1][y-1] == role) {
        empty = count;
        continue;
      } else {
        break;
      }
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
    if(x<0||y<0||x>=len||y>=len) {
      block ++;
      break;
    }
    var t = board[x][y];
    if(t === R.empty) {
      if(!empty && (x>0 && y>0) && board[x-1][y+1] == role) {
        empty = count;
        continue;
      } else {
        break;
      }
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  result += type(count, block, empty);

  return typeToScore(result);
}

module.exports = s;

},{"./count-to-type.js":6,"./role.js":14,"./type-to-score.js":16}],9:[function(require,module,exports){
var R = require("./role.js");
var scorePoint = require("./evaluate-point.js");
var hasNeighbor = require("./neighbor.js");
var S = require("./score.js");
var config = require("./config.js");

var evaluate = function(board, role, includeSelf) {
  
  var max = - S.FIVE;
  var min = - S.FIVE;
  role = role || R.com;

  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == R.empty) {
        if(hasNeighbor(board, [i, j], 2, 1)) { //必须是有邻居的才行
          max = Math.max(scorePoint(board, [i,j], role, includeSelf), max);
          min = Math.max(scorePoint(board, [i,j], R.reverse(role), includeSelf), min);
        }
      }
    }
  }

  return max-min;
}

module.exports = evaluate;

},{"./config.js":5,"./evaluate-point.js":8,"./neighbor.js":13,"./role.js":14,"./score.js":15}],10:[function(require,module,exports){
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
var hasNeighbor = require("./neighbor.js");
var S = require("./score.js");
var config = require("./config.js");

var gen = function(board, deep) {
  
  var fives = [];
  var fours=[];
  var twothrees=[];
  var threes = [];
  var twos = [];
  var neighbors = [];

  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == R.empty) {
        if(hasNeighbor(board, [i, j], 2, 1)) { //必须是有邻居的才行
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

module.exports = gen;

},{"./config.js":5,"./evaluate-point.js":8,"./neighbor.js":13,"./role.js":14,"./score.js":15}],11:[function(require,module,exports){
var threshold = 1.1;

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

},{}],12:[function(require,module,exports){
var evaluate = require("./evaluate");
var gen = require("./gen");
var R = require("./role");
var T = SCORE = require("./score.js");
var math = require("./math.js");
var checkmate = require("./checkmate.js");
var config = require("./config.js");
var zobrist = require("./zobrist.js");
var debug = require("./debug.js");

var MAX = SCORE.FIVE*10;
var MIN = -1*MAX;

var total=0, //总节点数
    steps=0,  //总步数
    count,  //每次思考的节点数
    PVcut,
    ABcut,  //AB剪枝次数
    cacheCount=0, //zobrist缓存节点数
    cacheGet=0; //zobrist缓存命中数量

var Cache = {};

var checkmateDeep = config.checkmateDeep;

/*
 * max min search
 * white is max, black is min
 */

var maxmin = function(board, deep, _checkmateDeep) {
  var best = MIN;
  var points = gen(board, deep);
  var bestPoints = [];

  count = 0;
  ABcut = 0;
  PVcut = 0;
  checkmateDeep = _checkmateDeep || checkmateDeep;

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board[p[0]][p[1]] = R.com;
    zobrist.go(p[0],p[1], R.com);
    var v = - max(board, deep-1, -MAX, -best, R.hum);

    //边缘棋子的话，要把分数打折，避免电脑总喜欢往边上走
    if(p[0]<3 || p[0] > 11 || p[1] < 3 || p[1] > 11) {
      v = .5 * v;
    }

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
    zobrist.go(p[0],p[1], R.com);
  }
  console.log("分数:"+best.toFixed(3)+", 待选节点:"+JSON.stringify(bestPoints));
  var result = bestPoints[Math.floor(bestPoints.length * Math.random())];
  result.score = best;
  steps ++;
  total += count;
  console.log('搜索节点数:'+ count+ ',AB剪枝次数:'+ABcut + ', PV剪枝次数:' + PVcut + ', 缓存命中:' + (cacheGet / cacheCount).toFixed(3) + ',' + cacheGet + '/' + cacheCount + ',算杀缓存命中:' + (debug.checkmate.cacheGet / debug.checkmate.cacheCount).toFixed(3) + ',' + debug.checkmate.cacheGet + '/'+debug.checkmate.cacheCount); //注意，减掉的节点数实际远远不止 ABcut 个，因为减掉的节点的子节点都没算进去。实际 4W个节点的时候，剪掉了大概 16W个节点
  console.log('当前统计：总共'+ steps + '步, ' + total + '个节点, 平均每一步' + Math.round(total/steps) +'个节点');
  console.log("================================");
  return result;
}

var max = function(board, deep, alpha, beta, role) {

  if(config.cache) {
    var c = Cache[zobrist.code];
    if(c) {
      if(c.deep >= deep) {
        cacheGet ++;
        return c.score;
      }
    }
  }

  var v = evaluate(board, role);
  count ++;
  if(deep <= 0 || math.greatOrEqualThan(v, T.FIVE)) {
    return v;
  }
  
  var best = MIN;
  var points = gen(board, deep);

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board[p[0]][p[1]] = role;
    zobrist.go(p[0],p[1], role);

    var v =- max(board, deep-1, -beta, -1 *( best > alpha ? best : alpha), R.reverse(role)) * config.deepDecrease;
    board[p[0]][p[1]] = R.empty;
    zobrist.go(p[0],p[1], role);
    if(math.greatThan(v, best)) {
      best = v;
    }
    if(math.greatOrEqualThan(v, beta)) { //AB 剪枝
      ABcut ++;
      cache(deep, v);
      return v;
    }
  }
  if( (deep == 2 || deep == 3 ) && math.littleThan(best, SCORE.THREE*2) && math.greatThan(best, SCORE.THREE * -1)
    ) {
    var mate = checkmate(board, role, checkmateDeep);
    if(mate) {
      var score = mate.score * Math.pow(.8, mate.length) * (role === R.com ? 1 : -1);
      cache(deep, score);
      return score;
    }
  }
  cache(deep, best);
  
  return best;
}

var cache = function(deep, score) {
  if(!config.cache) return;
  Cache[zobrist.code] = {
    deep: deep,
    score: score
  }
  cacheCount ++;
}

var deeping = function(board, deep) {
  deep = deep === undefined ? config.searchDeep : deep;
  //迭代加深
  //注意这里不要比较分数的大小，因为深度越低算出来的分数越不靠谱，所以不能比较大小，而是是最高层的搜索分数为准
  var result;
  for(var i=2;i<=deep; i+=2) {
    result = maxmin(board, i);
    if(math.greatOrEqualThan(result.score, SCORE.FOUR)) return result;
  }
  return result;
}
module.exports = deeping;

},{"./checkmate.js":4,"./config.js":5,"./debug.js":7,"./evaluate":9,"./gen":10,"./math.js":11,"./role":14,"./score.js":15,"./zobrist.js":17}],13:[function(require,module,exports){
var R = require("./role");
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

module.exports = hasNeighbor;

},{"./role":14}],14:[function(require,module,exports){
module.exports = {
  com: 2,
  hum: 1,
  empty: 0,
  reverse: function(r) {
    return r == 1 ? 2 : 1;
  }
}

},{}],15:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],16:[function(require,module,exports){
var T = require("./score.js");

/*
 * 只做一件事，就是修复冲四:
 * 如果是单独一个冲四，则将分数将至和活三一样
 * 如果是冲四活三或者双冲四，则分数和活四一样
 */
var s = function(type) {
  if(type < T.FOUR && type >= T.BLOCKED_FOUR) {

    if(type >= T.BLOCKED_FOUR && type < T.BLOCKED_FOUR * 2) {
      return T.THREE;
    } else {
      return T.FOUR;
    }
  }
  return type;
}

module.exports = s;

},{"./score.js":15}],17:[function(require,module,exports){
var R = require("./role.js");

var Zobrist = function(size) {
  this.size = size || 15;
}

Zobrist.prototype.init = function() {
  this.com = [];
  this.hum = [];
  for(var i=0;i<this.size*this.size;i++) {
    this.com.push(this._rand());
    this.hum.push(this._rand());
  }

  this.code = this._rand();
}

Zobrist.prototype._rand = function() {
  return Math.floor(Math.random() * 1000000000);  //再多一位就溢出了。。
}

Zobrist.prototype.go = function(x, y, role) {
  var index = this.size * x + y;
  this.code ^= (role == R.com ? this.com[index] : this.hum[index]);
  return this.code;
}

var z = new Zobrist();
z.init();

module.exports = z;

},{"./role.js":14}]},{},[3]);
