var gen = function(board) {
  var points = [];
  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == 0 && hasNeighbor(board, [i, j])) {
        points.push([i, j]);
      }
    }
  }
  return points;
}

//简单的规则，如果周围有邻居就作为可选的位子
var hasNeighbor = function(board, point) {
  var len = board.length;
  for(var i=point[0]-2;i<=point[0]+2;i++) {
    for(var j=point[1]-2;j<=point[1]+2;j++) {
      if(i<0||i==point[0]||i>=len) continue;
      if(j<0||j==point[1]||j>=len) continue;
      if(board[i][j] != 0) return true;
    }
  }
  return false;
}

module.exports = gen;
