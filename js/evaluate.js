var R = require("./role.js");
var scorePoint = require("./evaluate-point.js");
var hasNeighbor = require("./neighbor.js");
var S = require("./score.js");
var config = require("./config.js");

var evaluate = function(board, role) {
  
  var max = - S.FIVE;
  var min = - S.FIVE;
  role = role || R.com;

  for(var i=0;i<board.length;i++) {
    for(var j=0;j<board[i].length;j++) {
      if(board[i][j] == R.empty) {
        if(hasNeighbor(board, [i, j], 2, 2)) { //必须是有邻居的才行
          max = Math.max(scorePoint(board, [i,j], role), max);
          min = Math.max(scorePoint(board, [i,j], R.reverse(role)), min);
        }
      }
    }
  }

  return max-min;
}

module.exports = evaluate;
