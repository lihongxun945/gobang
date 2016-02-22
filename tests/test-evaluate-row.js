var e = require("../js/evaluate-row.js");
var S = require("../js/score.js");
var assert = require('assert');


describe('test evalute row', function() {
  describe('test zero score', function() {
    it(`zero should score zero`, function() {
      assert.equal(e([1], 1), 0);
      assert.equal(e([1, 2], 1), 0);
      assert.equal(e([2, 1], 1), 0);
      assert.equal(e([2, 1, 2], 1), 0);
    });
  });

  describe('test one score', function() {

    it(`blocked one should score ${S.BLOCKED_ONE}`, function() {
      assert.equal(e([1, 0], 1), S.BLOCKED_ONE);
      assert.equal(e([0, 1], 1), S.BLOCKED_ONE);
      assert.equal(e([1, 0, 0], 1), S.BLOCKED_ONE);
      assert.equal(e([1, 0, 2], 1), S.BLOCKED_ONE);
      assert.equal(e([2, 1, 0], 1), S.BLOCKED_ONE);
      assert.equal(e([2, 1, 0, 2], 1), S.BLOCKED_ONE);
      assert.equal(e([0, 0, 0, 2, 1, 0, 0, 0, 0, 0], 1), S.BLOCKED_ONE);
    });

    it(`one should score ${S.ONE}`, function() {
      assert.equal(e([0, 1, 0], 1), S.ONE);
      assert.equal(e([0, 0, 0, 0, 1, 0, 0, 0, 0, 0], 1), S.ONE);
      assert.equal(e([2, 0, 1, 0], 1), S.ONE);
      assert.equal(e([2, 0, 1, 0, 2], 1), S.ONE);
      assert.equal(e([2, 0, 2, 0, 1, 0, 2], 1), S.ONE);
    });
  })


  describe('test two score', function() {

    it(`blocked two should score ${S.BLOCKED_TWO}`, function() {
      assert.equal(e([1, 1, 0], 1), S.BLOCKED_TWO);
      assert.equal(e([1, 0, 1, 0], 1), S.BLOCKED_TWO);
      assert.equal(e([1, 1, 0, 2], 1), S.BLOCKED_TWO);
      assert.equal(e([1, 0, 1, 0, 2], 1), S.BLOCKED_TWO);
      assert.equal(e([2, 0, 1, 1], 1), S.BLOCKED_TWO);
      assert.equal(e([2, 0, 1, 0, 1], 1), S.BLOCKED_TWO);
      assert.equal(e([2, 1, 1, 0, 2], 1), S.BLOCKED_TWO);
      assert.equal(e([2, 0, 1, 1, 2, 1], 1), S.BLOCKED_TWO);
    });

    it(`two should score ${S.TWO}`, function() {
      assert.equal(e([0, 1, 1, 0], 1), S.TWO);
      assert.equal(e([0, 1, 0, 1, 0], 1), S.TWO);
      assert.equal(e([2, 0, 1, 1, 0, 2], 1), S.TWO);
      assert.equal(e([2, 0, 1, 0, 1, 0, 2], 1), S.TWO);
      assert.equal(e([0, 0, 0, 0, 1, 1, 0, 0, 0], 1), S.TWO);
    });
  })


  describe('test three score', function() {

    it(`blocked three should score ${S.BLOCKED_THREE}`, function() {
      assert.equal(e([1, 1, 1, 0], 1), S.BLOCKED_THREE);
      assert.equal(e([1, 0, 1, 1, 0], 1), S.BLOCKED_THREE);
      assert.equal(e([1, 1, 0, 1, 0], 1), S.BLOCKED_THREE);
      assert.equal(e([1, 1, 1, 0, 0, 0, 0], 1), S.BLOCKED_THREE);
      assert.equal(e([2, 2, 2, 1, 1, 1, 0, 0, 0, 0], 1), S.BLOCKED_THREE);
      assert.equal(e([0, 0, 2, 0, 1, 1, 1], 1), S.BLOCKED_THREE);
    });

    it(`three should score ${S.THREE}`, function() {
      assert.equal(e([0, 1, 1, 1, 0], 1), S.THREE);
      assert.equal(e([2, 0, 1, 1, 1, 0, 0], 1), S.THREE);
    });
  })



  describe('test four score', function() {

    it(`blocked four should score ${S.BLOCKED_FOUR}`, function() {
      assert.equal(e([1, 1, 1, 1, 0], 1), S.BLOCKED_FOUR);
      assert.equal(e([2, 1, 1, 1, 1, 0], 1), S.BLOCKED_FOUR);
      assert.equal(e([2, 0, 1, 1, 1, 1, 2], 1), S.BLOCKED_FOUR);
    });

    it(`four should score ${S.FOUR}`, function() {
      assert.equal(e([0, 1, 1, 1, 1, 0], 1), S.FOUR);
      assert.equal(e([0, 0, 0, 1, 1, 1, 1, 0, 0, 0], 1), S.FOUR);
      assert.equal(e([2, 0 , 2, 0, 1, 1, 1, 1, 0, 2, 0], 1), S.FOUR);
    });

    it(`four with an empty should score ${S.THREE}`, function() {
      assert.equal(e([0, 1, 0, 1, 1, 1, 0], 1), S.THREE);
      assert.equal(e([0, 1, 1, 0, 1, 1, 0], 1), S.THREE);
      assert.equal(e([0, 1, 1, 1, 0, 1, 0], 1), S.THREE);
    });
    it(`blocked four with an empty should score ${S.BLOCKED_THREE}`, function() {
      assert.equal(e([1, 0, 1, 1, 1, 0], 1), S.BLOCKED_FOUR);
      assert.equal(e([1, 1, 0, 1, 1, 0], 1), S.BLOCKED_FOUR);
      assert.equal(e([1, 1, 1, 0, 1, 0], 1), S.BLOCKED_FOUR);
    });
  })

  describe('test five score', function() {

    it(`five should score ${S.FOUR}`, function() {
      assert.equal(e([1, 1, 1, 1, 1], 1), S.FIVE);
      assert.equal(e([2, 1, 1, 1, 1, 1], 1), S.FIVE);
      assert.equal(e([2, 1, 1, 1, 1, 1, 2], 1), S.FIVE);
      assert.equal(e([2, 2, 2, 2, 1, 1, 1, 1, 1, 2, 2, 2, 2], 1), S.FIVE);
    });
    it(`not five`, function() {
      assert.notEqual(e([1, 1, 1, 1, 0, 1], 1), S.FIVE);
      assert.notEqual(e([1, 1, 0, 1, 1, 0, 1], 1), S.FIVE);
    });
  })

});
