var SCORE = require("./score.js");

var score = function(count, block, empty) {


  if(empty == 0) {
    if(count >= 5) return SCORE.FIVE;
    if(block === 0) {
      switch(count) {
        case 1: return SCORE.ONE;
        case 2: return SCORE.TWO;
        case 3: return SCORE.THREE;
        case 4: return SCORE.FOUR;
      }
    }

    if(block === 1) {
      switch(count) {
        case 1: return SCORE.BLOCKED_ONE;
        case 2: return SCORE.BLOCKED_TWO;
        case 3: return SCORE.BLOCKED_THREE;
        case 4: return SCORE.BLOCKED_FOUR;
      }
    }

  } else {
    //中间有一个空位，这种情况下只考虑二，三，四
    //有一个空位的四连其实和三连是一样的分数
    if(block === 0) {
      switch(count) {
        case 2: return SCORE.TWO;
        case 3:
        case 4: return SCORE.THREE;
      }
    }

    if(block === 1) {
      switch(count) {
        case 2: return SCORE.BLOCKED_TWO;
        case 3:
        case 4: return SCORE.BLOCKED_THREE;
      }
    }
  }

  return 0;
}

module.exports = score;
