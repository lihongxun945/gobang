import { config } from './config';
// 先入先出缓存
export default class Cache {
  constructor(capacity = 1000000) {
    this.capacity = capacity;
    this.cache = [];
    this.map = new Map();
    this.nextEviction = 0;
  }

  // 获取一个键的值
  get(key) {
    if (!config.enableCache) return false;
    if (this.map.has(key)) {
      return this.map.get(key);
    }
    return null;
  }

  // 设置或插入一个值
  put(key, value) {
    if (!config.enableCache) return false;
    if (this.map.has(key)) {
      this.map.set(key, value);
      return true;
    }
    if (this.cache.length < this.capacity) {
      this.cache.push(key);
    } else {
      const oldestKey = this.cache[this.nextEviction];
      this.map.delete(oldestKey);
      this.cache[this.nextEviction] = key;
      this.nextEviction = (this.nextEviction + 1) % this.capacity;
    }
    this.map.set(key, value);
    return true;
  }

  // 检查缓存中是否存在某个键
  has(key) {
    if (!config.enableCache) return false;
    return this.map.has(key);
  }
}
