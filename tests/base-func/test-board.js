var board = require("../../js/board.js");
var S = require("../../js/score.js");
var assert = require('assert');

var b;

var equal = function(a, b) {
  return a < b * 1.5 && a > b*0.5;
}

describe('test board', function() {
  it(`test evaluate two`, function() {
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
    assert.ok(equal(board.evaluate(2), S.TWO));
  });

  it(`test evaluate three`, function() {
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
    assert.ok(equal(board.evaluate(2), S.TWO));

    board.put([2, 5], 2);
    assert.ok(equal(board.evaluate(2), S.THREE));
  });

    

});
