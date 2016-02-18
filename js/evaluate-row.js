var r = require("./role");
var SCORE = require("./score.js");
var score = require("./count-to-score.js");
var table = require("./table.js");


//改进，使用棋型表进行打分
var eRow = function(line, role) {
  //先找到第一个己方棋子
  var first = -1;
  for(var i=0;i<line.length;i++) {
    if(line[i] == role) {
      first = i;
      break;
    }
  }

  if(first == -1) return 0; //空行


  //从first开始，分别向左右寻找
  var empty = 0;
  var s = first, e = first;
  //向左寻找
  while(--s>=0) {
    if(line[s] == r.empty) {
      empty ++;
      if(empty > 5) break;
    } else if(line[s] != role) break;
  }
  //向右寻找
  empty = 0;
  while(++e<line.length) {
    if(line[e] == r.empty) {
      empty ++;
      if(empty > 5) break;
    } else if(line[e] != role) break;
  }

  var str = line.slice(s+1, e).join("");
  str = str.replace(/0/g, "_").replace(role == 1 ? /1/g : /2/g, "O");

  var map = {
    "0": 0,
    "11": SCORE.BLOCKED_ONE,
    "21": SCORE.ONE,
    "31": SCORE.BLOCKED_TWO,
    "41": SCORE.TWO,
    "51": SCORE.BLOCKED_THREE,
    "61": SCORE.THREE,
    "71": SCORE.BLOCKED_FOUR,
    "72": SCORE.BLOCKED_FOUR, //特殊情况
    "81": SCORE.FOUR,
    "a1": SCORE.FIVE
  }

  if(e > line.length - 5) return map[table[str]] || 0;
  else return (map[table[str]] || 0) + eRow(line.slice(e), role);
}

module.exports = eRow;
