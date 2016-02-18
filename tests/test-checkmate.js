var c = require("../js/checkmate.js");
var assert = require('assert');

describe('test checkmate', function() {

  it(`it should be OK`, function() {
    b = [
      [0, 0, 0, 0, 0, 0],
      [2, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ];
    var p = c(b, 1);
    assert.ok(p);
  });

  it(`it should be OK`, function() {
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
    var p = c(b, 1);
    assert.ok(p);
  });
});
