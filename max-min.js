var evaluate = require("evaluate");
var gen = require("gen");
var role = require("role");

var MAX = 9999999;
var MIN = -1*MAX;

var min = function(board, deep) {
  var points = gen(board);
  var best = MAX;
  if(deep<=0) {
    points.forEach(function(p) {
      best = Math.min(evaluate(board, p), best);
    });
  } else {
    validPoint.forEach(function(p, i) {
      board[p[0]][p[1]] = role.black;
      best = Math.min(best, max(board, deep-1));
      board[p[0]][p[1]] = role.empty;
    });
  }
  return best;
}

var max = function(board, deep) {
  var points = gen(board);
  var best = MIN;
  if(deep<=0) {
    points.forEach(function(p) {
      best = Math.max(evaluate(board, p), best);
    });
  } else {
    validPoint.forEach(function(p, i) {
      board[p[0]][p[1]] = role.white;
      best = Math.max(best, max(board, deep-1));
      board[p[0]][p[1]] = role.empty;
    });
  }
  return best;
}

/*
 * max min search
 * white is max, black is min
 */
var maxmin = function(board, deep, currentRole) {
  if(currentRole = role.white) {
    return max(board, deep-1);
  }
  return min(board, deep-1)
}

module.exports = maxmin;
