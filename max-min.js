var evaluate = require("./evaluate");
var gen = require("./gen");
var role = require("./role");

var MAX = 9999999;
var MIN = -1*MAX;

/*
 * max min search
 * white is max, black is min
 */
var maxmin = function(board, deep) {
  var best = MIN;
  var points = gen(board);
  var result;

  points.forEach(function(p) {
    board[p[0]][p[1]] = role.com;
    var v = min(board, deep-1, MIN, MAX);
    if(v > best) {
      best = v;
      result = p;
    }
    board[p[0]][p[1]] = 0;
  });
  console.log(best);
  return result;
}

var min = function(board, deep, alpha, beta) {
  var v = evaluate(board);
  if(deep <= 0 || v >= 100000 || v <= -100000 || alpha >= beta) {
    return v;
  }

  var best = MAX;
  var points = gen(board);

  points.forEach(function(p) {
    board[p[0]][p[1]] = role.hum;
    var v = max(board, deep-1, alpha, best < beta ? best : beta);
    if(v < best ) {
      best = v;
    }
    board[p[0]][p[1]] = 0;
  });
  return best ;
}


var max = function(board, deep, alpha, beta) {
  var v = evaluate(board);
  if(deep <= 0 || v >= 100000 || v <= -100000 || alpha >= beta) {
    return v;
  }

  var best = MIN;
  var points = gen(board);

  points.forEach(function(p) {
    board[p[0]][p[1]] = role.com;
    var v = max(board, deep-1, best > alpha ? best : alpha, beta);
    if(v > best) {
      best = v;
    }
    board[p[0]][p[1]] = 0;
  });
  return best;
}

module.exports = maxmin;
