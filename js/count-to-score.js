var SCORE = require("./score.js");

var score = function(count, block) {

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

  return 0;
}

module.exports = score;
