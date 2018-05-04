var c = require("../js/vcx.js");
var assert = require('assert');
var board = require("../js/board.js");

describe('test checkmate', function() {

  it(`it should be OK`, function() {
    // 冲四，活三，胜
    b = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 0, 1, 0, 0, 0, 0],
      [0, 0, 0, 2, 2, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 2, 0],
      [0, 0, 1, 2, 2, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];
    var start = + new Date;
    board.init(b);
    var count = 1000;
    var p;
    while (count--) p = c.vct(1, 10);
    console.log(p)
    console.log(`用时${+new Date - start}S`);
    assert.ok(p);
  });

});
