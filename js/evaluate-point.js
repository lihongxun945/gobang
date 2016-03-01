/*
 * 启发式评价函数
 * 这个是专门给某一个空位打分的，不是给整个棋盘打分的
 * 并且是只给某一个角色打分
 */
var S = require("./score.js");
var R = require("./role.js");
var SCORE = require("./count-to-score.js");

/*
 * 表示在当前位置下一个棋子后的分数
 */

var s = function(board, p, role, config) {
  var result = 0;
  var count = 0, block = 0;

  var len = board.length;
  var score = SCORE;

  for(var k in config) score[k] = config[k];

  //横向
  count = 1;  //默认把当前位置当做己方棋子。因为算的是当前下了一个己方棋子后的分数
  block = 0;
  empty = 0;

  for(var i=p[1]+1;true;i++) {
    if(i>=len) {
      block ++;
      break;
    }
    var t = board[p[0]][i];
    if(t === R.empty) {
      if(!empty && i<len-1 && board[p[0]][i+1] == role) {
        empty = count;
        continue;
      } else {
        break;
      }
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  for(var i=p[1]-1;true;i--) {
    if(i<0) {
      block ++;
      break;
    }
    var t = board[p[0]][i];
    if(t === R.empty) {
      if(!empty && i>0 && board[p[0]][i-1] == role) {
        empty = count;
        continue;
      } else {
        break;
      }
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  result += score(count, block, empty);

  //纵向
  count = 1;
  block = 0;
  empty = 0;

  for(var i=p[0]+1;true;i++) {
    if(i>=len) {
      block ++;
      break;
    }
    var t = board[i][p[1]];
    if(t === R.empty) {
      if(!empty && i<len-1 && board[i+1][p[1]] == role) {
        empty = count;
        continue;
      } else {
        break;
      }
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  for(var i=p[0]-1;true;i--) {
    if(i<0) {
      block ++;
      break;
    }
    var t = board[i][p[1]];
    if(t === R.empty) {
      if(!empty && i>0 && board[i-1][p[1]] == role) {
        empty = count;
        continue;
      } else {
        break;
      }
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  result += score(count, block, empty);


  // \\
  count = 1;
  block = 0;
  empty = 0;

  for(var i=1;true;i++) {
    var x = p[0]+i, y = p[1]+i;
    if(x>=len || y>=len) {
      block ++;
      break;
    }
    var t = board[x][y];
    if(t === R.empty) {
      if(!empty && (x<len-1 && y < len-1) && board[x+1][y+1] == role) {
        empty = count;
        continue;
      } else {
        break;
      }
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  for(var i=1;true;i++) {
    var x = p[0]-i, y = p[1]-i;
    if(x<0||y<0) {
      block ++;
      break;
    }
    var t = board[x][y];
    if(t === R.empty) {
      if(!empty && (x>0 && y>0) && board[x-1][y-1] == role) {
        empty = count;
        continue;
      } else {
        break;
      }
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  result += score(count, block, empty);


  // \/
  count = 1;
  block = 0;
  empty = 0;

  for(var i=1; true;i++) {
    var x = p[0]+i, y = p[1]-i;
    if(x<0||y<0||x>=len||y>=len) {
      block ++;
      break;
    }
    var t = board[x][y];
    if(t === R.empty) {
      if(!empty && (x<len-1 && y<len-1) && board[x+1][y-1] == role) {
        empty = count;
        continue;
      } else {
        break;
      }
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  for(var i=1;true;i++) {
    var x = p[0]-i, y = p[1]+i;
    if(x<0||y<0||x>=len||y>=len) {
      block ++;
      break;
    }
    var t = board[x][y];
    if(t === R.empty) {
      if(!empty && (x>0 && y>0) && board[x-1][y+1] == role) {
        empty = count;
        continue;
      } else {
        break;
      }
    }
    if(t === role) {
      count ++;
      continue;
    } else {
      block ++;
      break;
    }
  }

  result += score(count, block, empty);

  return result;

}

module.exports = s;
