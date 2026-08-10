const inverseTransforms = [0, 3, 2, 1, 4, 5, 6, 7];

export const transformPoint = ([x, y], size, transform) => {
  const last = size - 1;
  switch (transform) {
    case 1: return [y, last - x];
    case 2: return [last - x, last - y];
    case 3: return [last - y, x];
    case 4: return [x, last - y];
    case 5: return [last - x, y];
    case 6: return [y, x];
    case 7: return [last - y, last - x];
    default: return [x, y];
  }
};

export const inverseTransformPoint = (point, size, transform) => (
  transformPoint(point, size, inverseTransforms[transform])
);

const positionKey = (stones, size, transform) => {
  const encoded = stones.map(({ x, y, role }) => {
    const [tx, ty] = transformPoint([x, y], size, transform);
    return `${tx},${ty},${role}`;
  }).sort();
  return `${size}|${encoded.join(';')}`;
};

export const canonicalizePosition = (stones, size) => {
  let key = null;
  let transforms = [];
  for (let candidate = 0; candidate < 8; candidate += 1) {
    const candidateKey = positionKey(stones, size, candidate);
    if (key === null || candidateKey < key) {
      key = candidateKey;
      transforms = [candidate];
    } else if (candidateKey === key) {
      transforms.push(candidate);
    }
  }
  return { key, transform: transforms[0], transforms };
};
