var r = require("./role");
var SCORE = require("./score.js");
var score = require("./count-to-score.js");


var eRow = function(line, role) {
  var count = 0; // 连子数
  var block = 0; // 封闭数
  var empty = 0;  //空位数
  var value = 0;  //分数

  for(var i=0;i<line.length;i++) {
    if(line[i] == role) { // 发现第一个己方棋子
      count=1;
      block=0;
      empty=0;

      //判断左边界
      if(i==0) block=1;
      else if(line[i-1] != r.empty) block = 1;

      //计算己方棋子数
      for(i=i+1;i<line.length;i++) {
        if(line[i] == role) {
          count ++;
        } else if(!empty && i < line.length-1 && line[i] == r.empty && line[i+1] == role) empty=count;  //只计算中间的一个空位，也就是己方棋子之间的一个空位。
        else break;
      }

      //判断右边界
      if(i==line.length || line[i] != r.empty) block++;
      value += score(count, block, empty);
    }
  }

  return value;
}

module.exports = eRow;
