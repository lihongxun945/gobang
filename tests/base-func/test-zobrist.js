var z = require("../../js/zobrist.js");
var assert = require('assert');

describe('test Zobrist', function() {
  it(`简单测试`, function() {
    z.init();
    var code = z.code;

    console.log(z.go(1,1,1));

    assert.notEqual(z.code, code);

    console.log(z.go(1,1,1));

    assert.equal(z.code, code);

    console.log(z.go(1,2,2));

    assert.notEqual(z.code, code);
  });

  it(`两种不同顺序的走法应该返回同一个code`, function() {
    z.init();
    z.go(1,1,1);
    z.go(1,2,2);
    z.go(2,1,1);
    z.go(2,2,2);
    var code1 = z.code;

    z.go(2,1,1);
    z.go(2,2,2);
    z.go(1,1,1);
    z.go(1,2,2);

    var code2 = z.code;

    assert.notEqual(code1, code2);
  });
});
