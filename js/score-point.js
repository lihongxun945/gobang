/*
 * 启发式评价函数
 * 这个是专门给某一个空位打分的，不是给整个棋盘打分的
 */
var score = require("./score.js");
var role = require("./role.js");
var eRow = require("./evaluate-row.js");

var s = function(board, p) {
  var result = 0;
  var line = [];

  var len = board.length;

  //方便起见，不考虑边界

  if(p[0] == 0 || p[0] == len-1) return result;
  if(p[1] == 0 || p[1] == len-1) return result;


  line=[];
  for(var i=0;i<len;i++) {
    line.push(board[p[0]][i]);
  }
  result += eRow(line, role.com);
  result += eRow(line, role.hum);


  line=[];
  for(var i=0;i<len;i++) {
    line.push(board[i][p[1]]);
  }
  result += eRow(line, role.com);
  result += eRow(line, role.hum);

  return result;

}

module.exports = s;
