/*
 * 产生待选的节点
 * 这个函数的优化非常重要，如果能对返回的节点排序，先返回优先级高的节点。那么能极大提升剪枝效率，从而缩短计算时间。
 * 目前优化方式：
 * 1. 优先级排序，按邻居的个数和远近排序
 * 2. 当搜索最后两层的时候，只搜索有相邻邻居的节点
 */

var role = require("./role.js");

var gen = function(board, deep) {
  var neighbors = [];
  var nextNeighbors = [];
  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == role.empty) {
        if(hasNeighbor(board, [i, j], 1, 1)) {
          neighbors.push([i, j]);
        } else if(deep >= 2 && hasNeighbor(board, [i, j], 2, 2)) {
          nextNeighbors.push([i, j]);
        }
      }
    }
  }
  return neighbors.concat(nextNeighbors);
}

//有邻居
var hasNeighbor = function(board, point, distance, count) {
  var len = board.length;
  for(var i=point[0]-distance;i<=point[0]+distance;i++) {
    if(i<0||i>=len) continue;
    for(var j=point[1]-distance;j<=point[1]+distance;j++) {
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
