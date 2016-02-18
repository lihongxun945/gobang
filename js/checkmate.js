/*
 * 算杀
 * 算杀的原理和极大极小值搜索是一样的
 * 不过算杀只考虑冲四活三这类对方必须防守的棋
 * 因此算杀的复杂度虽然是 M^N ，但是底数M特别小，可以算到20步以上的杀棋。
 */

var R = require("./role.js");
var hasNeighbor = require("./neighbor.js");
var scorePoint = require("./evaluate-point.js");
var S = require("./score.js");
var win = require("./win.js");

//找到所有比目标分数大的位置
var find = function(board, role, score) {
  var result = [];
  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == R.empty) {
        var p = [i, j];
        if(hasNeighbor(board, p, 2, 1)) { //必须是有邻居的才行
          if(role) {
            var s = scorePoint(board, p, role);
            if(s >= score) {
              p.score = s;
              result.push(p);
            }
          } else {
            var s1 = scorePoint(board, p, R.com);
            var s2 = scorePoint(board, p, R.hum);
            var s = Math.max(s1, s2);
            if(s > score) {
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

var max = function(board, role, deep, steps) {
  var w = win(board);
  if(w == role) return true;
  if(w == R.reverse(role)) return false;
  if(deep < 0) return false;
  var points = find(board, role, S.BLOCKED_FOUR);
  if(points.length == 0) return false;
  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board[p[0]][p[1]] = role;
    steps.push(p);
    var m = min(board, role, deep-1, steps);
    board[p[0]][p[1]] = R.empty;
    if(m) {
      return p;
    } else {
      steps.pop();
    }
  }
  return false;
}


//只要有一种方式能防守住，就可以了
var min = function(board, role, deep, steps) {
  var w = win(board);
  if(w == role) return true;
  if(w == R.reverse(role)) return false;
  if(deep < 0) return false;
  var points = find(board, 0, S.FOUR);
  if(points.length == 0) return false;
  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board[p[0]][p[1]] = R.reverse(role);
    steps.push(p);
    var m = max(board, role, deep-1, steps);
    board[p[0]][p[1]] = R.empty;
    steps.pop();
    if(m) {
      continue;
    } else {
      return false; //只要有一种能防守住
    }
  }
  return true;  //无法防守住
}

var c = function(board, role, deep) {
  if(deep <= 0) return false;
  deep = deep || 20;
  var steps = [];
  var result = max(board, role, deep, steps);
  if(result) console.log("算杀成功:" + JSON.stringify(steps));
  return result;
}

module.exports = c;
