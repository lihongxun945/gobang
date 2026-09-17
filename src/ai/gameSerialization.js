const GAME_FORMAT = 'gobang-game';
const GAME_FORMAT_VERSION = 1;
const WIN_DIRECTIONS = [[1, 0], [0, 1], [1, 1], [1, -1]];

const hasFiveAt = (board, size, i, j, role) => {
  for (let direction = 0; direction < WIN_DIRECTIONS.length; direction += 1) {
    const [di, dj] = WIN_DIRECTIONS[direction];
    let count = 1;
    for (const sign of [-1, 1]) {
      for (let step = 1; step < 5; step += 1) {
        const x = i + sign * step * di;
        const y = j + sign * step * dj;
        if (x < 0 || x >= size || y < 0 || y >= size || board[x][y] !== role) break;
        count += 1;
      }
    }
    if (count >= 5) return true;
  }
  return false;
};

export const serializeGame = ({ size, aiFirst, depth, openingBook, history }) => JSON.stringify({
  format: GAME_FORMAT,
  version: GAME_FORMAT_VERSION,
  size,
  aiFirst: Boolean(aiFirst),
  depth: Number(depth) || 6,
  openingBook: Boolean(openingBook),
  history: history.map(({ i, j, role }) => ({ i, j, role })),
}, null, 2);

export const deserializeGame = (text, expectedSize = 15) => {
  if (typeof text !== 'string' || !text.trim()) {
    return { ok: false, error: '内容为空' };
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { ok: false, error: `JSON 解析失败：${error.message}` };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: '格式不正确：顶层应为对象' };
  }
  if (parsed.format !== GAME_FORMAT) {
    return { ok: false, error: `格式标识不匹配（期望 ${GAME_FORMAT}）` };
  }
  if (parsed.version !== GAME_FORMAT_VERSION) {
    return { ok: false, error: `不支持的版本：${parsed.version}` };
  }

  const size = Number(parsed.size);
  if (!Number.isInteger(size) || size !== expectedSize) {
    return { ok: false, error: `棋盘尺寸不支持（需为 ${expectedSize}）` };
  }
  if (typeof parsed.aiFirst !== 'boolean') {
    return { ok: false, error: 'aiFirst 必须是布尔值' };
  }
  if (typeof parsed.openingBook !== 'boolean') {
    return { ok: false, error: 'openingBook 必须是布尔值' };
  }

  const depth = Number(parsed.depth);
  if (!Number.isInteger(depth) || depth < 1 || depth > 20) {
    return { ok: false, error: 'depth 必须是 1~20 的整数' };
  }
  if (!Array.isArray(parsed.history)) {
    return { ok: false, error: 'history 必须是数组' };
  }
  if (parsed.history.length > size * size) {
    return { ok: false, error: '落子数量超过棋盘容量' };
  }

  const board = Array(size).fill().map(() => Array(size).fill(0));
  const history = [];
  let gameOver = false;

  for (let index = 0; index < parsed.history.length; index += 1) {
    const move = parsed.history[index];
    const moveNo = index + 1;
    if (!move || typeof move !== 'object' || Array.isArray(move)) {
      return { ok: false, error: `第 ${moveNo} 手格式不正确` };
    }
    const i = Number(move.i);
    const j = Number(move.j);
    const role = Number(move.role);
    if (!Number.isInteger(i) || !Number.isInteger(j) || i < 0 || i >= size || j < 0 || j >= size) {
      return { ok: false, error: `第 ${moveNo} 手坐标越界` };
    }
    if (role !== 1 && role !== -1) {
      return { ok: false, error: `第 ${moveNo} 手角色非法（须为 1 或 -1）` };
    }
    const expectedRole = index % 2 === 0 ? 1 : -1;
    if (role !== expectedRole) {
      return { ok: false, error: '落子顺序非法：须黑先、黑白交替' };
    }
    if (gameOver) {
      return { ok: false, error: '棋局已分出胜负，其后不应再有落子' };
    }
    if (board[i][j] !== 0) {
      return { ok: false, error: `第 ${moveNo} 手位置重复` };
    }
    board[i][j] = role;
    history.push({ i, j, role });
    if (hasFiveAt(board, size, i, j, role)) gameOver = true;
  }

  return {
    ok: true,
    data: {
      size,
      aiFirst: parsed.aiFirst,
      depth,
      openingBook: parsed.openingBook,
      history,
    },
  };
};
