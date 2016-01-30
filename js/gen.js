/*
 * 产生待选的节点
 * 这个函数的优化非常重要，如果能对返回的节点排序，先返回优先级高的节点。那么能极大提升剪枝效率，从而缩短计算时间。
 */

var role = require("./role.js");

var gen = function(board) {
  var neighbors = [];
  var nextNeighbors = [];
  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == role.empty) {
        if(hasNeighbor(board, [i, j])) {
          neighbors.push([i, j]);
        }
        if(hasNextNeighbor(board, [i, j])) {
          nextNeighbors.push([i, j]);
        }
      }
    }
  }
  return neighbors.concat(nextNeighbors);
}

//有邻居
var hasNeighbor = function(board, point) {
  var len = board.length;
  for(var i=point[0]-1;i<=point[0]+1;i++) {
    if(i<0||i>=len) continue;
    for(var j=point[1]-1;j<=point[1]+1;j++) {
      if(j<0||j>=len) continue;
      if(i==point[0] && j==point[1]) continue;
      if(board[i][j] != role.empty) return true;
    }
  }
  return false;
}


//隔一个空位有邻居，为了提高效率，至少有两个邻居才行。
var hasNextNeighbor = function(board, point) {
  var len = board.length;
  var count = 0;
  for(var i=point[0]-2;i<=point[0]+2;i++) {
    if(i<0||i>=len) continue;
    for(var j=point[1]-2;j<=point[1]+2;j++) {
      if(j<0||j>=len) continue;
      if(i==point[0] && j==point[1]) continue;
      if(board[i][j] != role.empty) {
        count ++;
        if(count >= 2) return true;
      }
    }
  }
  return false;
}

module.exports = gen;
