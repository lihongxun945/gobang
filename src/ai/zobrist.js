/* global BigInt */
export default class ZobristCache {
  constructor(size) {
    this.size = size;
    this.zobristTable = this.initializeZobristTable(size);
    this.hash = BigInt(0);
  }

  initializeZobristTable(size) {
    let table = [];
    for (let i = 0; i < size; i++) {
      table[i] = [];
      for (let j = 0; j < size; j++) {
        table[i][j] = {
          "1": BigInt(this.randomBitString(64)), // black
          "-1": BigInt(this.randomBitString(64))  // white
        };
      }
    }
    return table;
  }

  randomBitString(length) {
    let str = "0b";
    for (let i = 0; i < length; i++) {
      str += Math.round(Math.random()).toString();
    }
    return str;
  }

  togglePiece(x, y, role) {
    this.hash ^= this.zobristTable[x][y][role];
  }

  getHash() {
    return this.hash;
  }
}