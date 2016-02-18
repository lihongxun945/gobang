var evaluate = require("./evaluate");
var gen = require("./gen");
var R = require("./role");
var SCORE = require("./score.js");
var win = require("./win.js");

var MAX = SCORE.FIVE*10;
var MIN = -1*MAX;

var total,  //总节点数
    ABcut  //AB剪枝次数

/*
 * max min search
 * white is max, black is min
 */
var maxmin = function(board, deep) {
  var best = MIN;
  var points = gen(board, deep);
  var bestPoints = [];
  deep = deep === undefined ? 5 : deep;

  total = 0;
  ABcut = 0;

  for(var i=0;i<points.length;i++) {
    var p = points[i];
    board[p[0]][p[1]] = R.com;
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
    board[p[0]][p[1]] = R.empty;
  }
  var result = bestPoints[Math.floor(bestPoints.length * Math.random())];
  console.log('当前局面分数：' + best);
  console.log('搜索节点数:'+ total+ ',AB剪枝次数:'+ABcut); //注意，减掉的节点数实际远远不止 ABcut 个，因为减掉的节点的子节点都没算进去。实际 4W个节点的时候，剪掉了大概 16W个节点
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
    board[p[0]][p[1]] = R.hum;
    var v = max(board, deep-1, best < alpha ? best : alpha, beta);
    board[p[0]][p[1]] = R.empty;
    if(v < best ) {
      best = v;
    }
    if(v <= beta) {  //AB剪枝
      ABcut ++;
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
    board[p[0]][p[1]] = R.com;
    var v = min(board, deep-1, alpha, best > beta ? best : beta);
    board[p[0]][p[1]] = R.empty;
    if(v > best) {
      best = v;
    }
    if(v >= alpha) { //AB 剪枝
      ABcut ++;
      break;
    }
  }
  return best;
}

module.exports = maxmin;
