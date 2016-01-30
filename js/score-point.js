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

  line=[];
  for(var i=p[0]-4;i<=p[0]+4;i++) {//只截最近的一段。不然可能会把同一行的其他的分加上
    if(i<0 || i>=len) continue;
    line.push(board[p[0]][i]);
  }
  result += eRow(line, role.com);
  result += eRow(line, role.hum);


  line=[];
  for(var i=p[1]-4;i<=p[1]+4;i++) {
    if(i<0 || i>=len) continue;
    line.push(board[i][p[1]]);
  }
  result += eRow(line, role.com);
  result += eRow(line, role.hum);


  line=[];
  for(var i=-4;i<=4;i++) {
    var x=p[0]+i;
    var y=p[1]+i;
    if(x<0 || x>=len) continue;
    if(y<0 || y>=len) continue;
    line.push(board[x][y]);
  }
  result += eRow(line, role.com);
  result += eRow(line, role.hum);


  line=[];
  for(var i=-4;i<=4;i++) {
    var x=p[0]-i;
    var y=p[1]+i;
    if(x<0 || x>=len) continue;
    if(y<0 || y>=len) continue;
    line.push(board[x][y]);
  }
  result += eRow(line, role.com);
  result += eRow(line, role.hum);

  return result;

}

module.exports = s;
