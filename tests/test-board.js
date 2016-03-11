var board = require("../js/board.js");
var S = require("../js/score.js");
var assert = require('assert');

var b;

var equal = function(a, b) {
  return a < b * 1.2 && a > b*0.8;
}

describe('test board', function() {
  it(`test evaluate`, function() {
    b = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 2, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ];
    board.init(b);
    board.put([2,3], 2);
    console.log(board.evaluate(2));
    assert.ok(equal(board.evaluate(2), S.THREE));

    b = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 2, 2, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ];
    board.init(b);
    assert.ok(equal(board.evaluate(2), S.THREE));

    board.put([2, 5], 2);
    assert.ok(equal(board.evaluate(2), S.FOUR));
  });

  it(`test gen`, function() {
    b = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 2, 2, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ];
    board.init(b);
    assert.ok(board.gen().length);

    b = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [2, 2, 2, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 2, 0, 0, 0],
      [0, 0, 0, 1, 0, 2, 0, 0],
      [0, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ];
    //冲四活三的优先级比双活三高

    board.init(b);
    var p = board.gen()[0];
    assert.equal(p[0], 2);
    assert.equal(p[1], 3);
  });


});
