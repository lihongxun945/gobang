var SCORE = require("./score.js");

var score = function(count, block, empty) {

  if(empty === undefined) empty = 0;

  //没有空位
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

  } else if(empty === 1 || empty == count-1) {
    //第二个是空位
    if(count >= 6) {
      return SCORE.FIVE;
    }
    if(block === 0) {
      switch(count) {
        case 2: return SCORE.TWO;
        case 3:
        case 4: return SCORE.THREE;
        case 5: return SCORE.FOUR;
      }
    }

    if(block === 1) {
      switch(count) {
        case 2: return SCORE.BLOCKED_TWO;
        case 3: return SCORE.BLOCKED_THREE;
        case 4: return SCORE.THREE;
        case 5: return SCORE.BLOCKED_FOUR;
      }
    }
  } else if(empty === 2 || empty == count-2) {
    //第二个是空位
    if(count >= 7) {
      return SCORE.FIVE;
    }
    if(block === 0) {
      switch(count) {
        case 3:
        case 4:
        case 5: return SCORE.THREE;
        case 6: return SCORE.FOUR;
      }
    }

    if(block === 1) {
      switch(count) {
        case 3: return SCORE.BLOCKED_THREE;
        case 4: return SCORE.BLOCKED_FOUR;
        case 5: return SCORE.BLOCKED_FOUR;
        case 6: return SCORE.FOUR;
      }
    }

    if(block === 2) {
      switch(count) {
        case 4:
        case 5:
        case 6: return SCORE.BLOCKED_FOUR;
      }
    }
  } else if(empty === 3 || empty == count-3) {
    if(count >= 8) {
      return SCORE.FIVE;
    }
    if(block === 0) {
      switch(count) {
        case 4:
        case 5: return SCORE.THREE;
        case 6: return SCORE.THREE*2;
        case 7: return SCORE.FOUR;
      }
    }

    if(block === 1) {
      switch(count) {
        case 4:
        case 5:
        case 6: return SCORE.BLOCKED_FOUR;
        case 7: return SCORE.FOUR;
      }
    }

    if(block === 2) {
      switch(count) {
        case 4:
        case 5:
        case 6:
        case 7: return SCORE.BLOCKED_FOUR;
      }
    }
  } else if(empty === 4 || empty == count-4) {
    if(count >= 9) {
      return SCORE.FIVE;
    }
    if(block === 0) {
      switch(count) {
        case 5:
        case 6:
        case 7:
        case 8: return SCORE.FOUR;
      }
    }

    if(block === 1) {
      switch(count) {
        case 4:
        case 5:
        case 6:
        case 7: return SCORE.BLOCKED_FOUR;
        case 8: return SCORE.FOUR;
      }
    }

    if(block === 2) {
      switch(count) {
        case 5:
        case 6:
        case 7:
        case 8: return SCORE.BLOCKED_FOUR;
      }
    }
  } else if(empty === 5 || empty == count-5) {
    return SCORE.FIVE;
  }

  return 0;
}

module.exports = score;
