//算杀

var R = require("./role.js");
var hasNeighbor = require("./neighbor.js");

//找到所有能形成活三或者冲四的位置
var find = function(board, role) {
  var result = [];
  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == R.empty) {
        if(hasNeighbor(board, [i, j], 2, 1)) { //必须是有邻居的才行
          var score = scorePoint(board, [i,j], role);
          if(score >= S.BLOCKED_FOUR) result.push([i, j]);
        }
      }
    }
  }
  return result;
}

var defend

var checkmate = function(board, role, deep) {

  if(deep <= 0) return false;

  var points = find(board, role);

  if(points.length > 0) {
    for(var i=0;i<points.length;i++) {
      var p = points[i];
      board[p[0]][p[1]] = role;
      board[p[0]][p[1]] = R.empty;
    }
  }

  return false;
}

