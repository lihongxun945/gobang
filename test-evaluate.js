var e = require("./evaluate.js");

var b = [
  [0, 0, 0],
  [0, 2, 0],
  [0, 0, 0],
]

console.log(e(b));

b = [
  [0, 0, 0],
  [0, 1, 0],
  [0, 0, 0],
]

console.log(e(b));


b = [
  [0, 2, 0],
  [0, 1, 0],
  [0, 0, 0],
]

console.log(e(b));


b = [
  [0, 1, 0],
  [0, 2, 0],
  [0, 0, 0],
]

console.log(e(b));
