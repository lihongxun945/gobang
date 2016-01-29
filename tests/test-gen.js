var g = require("../js/gen.js");
var assert = require('assert');
var b;

describe('test gen', function() {
  it(`should be 8`, function() {
    b = [
      [0, 0, 0],
      [0, 2, 0],
      [0, 0, 0],
    ];
    assert.equal(g(b).length, 8);
  });
});
