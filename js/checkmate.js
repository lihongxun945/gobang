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
var S = require("./score.js");
var win = require("./win.js");
var config = require("./config.js");

//找到所有比目标分数大的位置
var find = function(board, role, score) {
  var result = [];
  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == R.empty) {
        var p = [i, j];
        if(hasNeighbor(board, p, 2, 1)) { //必须是有邻居的才行

          if(role == R.empty) {
            var s1 = scorePoint(board, p, R.com);
            var s2 = scorePoint(board, p, R.hum);
            var s = s1+s2;
            if(s > score) {
              p.score = s;
              result.push(p);
            }
          } else {
            var s = scorePoint(board, p, role);
            if(s >= score) {
              p.score = s;
              result.push(p);
            }
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

var max = function(board, role, deep) {
  var w = win(board);
  if(w == role) return true;
  if(w == R.reverse(role)) return false;
  if(deep < 0) return false;

  var points = find(board, role, S.BLOCKED_FOUR);
  if(points.length == 0) return false;
  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board[p[0]][p[1]] = role;
    var m = min(board, role, deep-1);
    board[p[0]][p[1]] = R.empty;
    if(m) {
      if(m.length) {
        m.unshift(p); //注意 unshift 方法返回的是新数组长度，而不是新数组本身
        return m;
      } else {
        return [p];
      }
    }
  }
  return false;
}


//只要有一种方式能防守住，就可以了
var min = function(board, role, deep) {
  var w = win(board);
  if(w == role) return true;
  if(w == R.reverse(role)) return false;
  if(deep < 0) return false;
  var points = find(board, R.empty, S.FOUR);
  if(points.length == 0) return false;

  var cands = [];
  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board[p[0]][p[1]] = R.reverse(role);
    var m = max(board, role, deep-1);
    board[p[0]][p[1]] = R.empty;
    if(m) {
      m.unshift(p);
      cands.push(m);
      continue;
    } else {
      return false; //只要有一种能防守住
    }
  }
  return cands[Math.floor(cands.length*Math.random())];  //无法防守住
}

var c = function(board, role, deep) {
  deep = deep || config.checkmateDeep;
  if(deep <= 0) return false;
  var start = new Date();
  //迭代加深
  for(var i=2;i<=deep;i++) {
    var result = max(board, role, i);
    if(result) break; //找到一个就行
  }
  var time = Math.round(new Date() - start);
  if(result) console.log("算杀成功("+time+"毫秒):" + JSON.stringify(result));
  else {
    //console.log("算杀失败("+time+"毫秒)");
  }
  return result;
}

module.exports = c;
