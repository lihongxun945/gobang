var array = require("./arrary.js");

function Statistic() {
}

Statistic.prototype.init = function (size) {
  this.table = array.create(size, size);
}

Statistic.prototype.print = function () {
  console.log(this.table.map(function (r) { return r.map(i=>parseInt(Math.sqrt(i/10000))).join(',') }))
}

module.exports = new Statistic()
