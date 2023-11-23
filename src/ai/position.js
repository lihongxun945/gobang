import { config } from "./config";
// 坐标转换函数
export const position2Coordinate = function (position, size) {
  return [Math.floor(position / size), position % size];
};

export const coordinate2Position = function (x, y, size) {
  return x * size + y;
};

// a和b是否在一条直线上，且距离小于maxDistance
export const isLine = function (a, b, size) {
  const maxDistance = config.inLineDistance;
  const [x1, y1] = position2Coordinate(a, size);
  const [x2, y2] = position2Coordinate(b, size);
  return (
    (x1 === x2 && Math.abs(y1 - y1) < maxDistance) ||
    (y1 === y2 && Math.abs(x1 - x2) < maxDistance) ||
    (Math.abs(x1 - x2) === Math.abs(y1 - y2) && Math.abs(x1 - x2) < maxDistance)
  );
}

export const isAllInLine = function (p, arr, size) {
  for (let i = 0; i < arr.length; i++) {
    if (!isLine(p, arr[i], size)) {
      return false;
    }
  }
  return true;
}
export const hasInLine = function (p, arr, size) {
  for (let i = 0; i < arr.length; i++) {
    if (isLine(p, arr[i], size)) {
      return true;
    }
  }
  return false;
}