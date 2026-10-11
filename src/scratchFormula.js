// 刮刮樂公式：D = A + B + C，號碼 = D × (中獎率 + N)，N = step × k (k = 1, 2, 3...)
export const computeScratchNumbers = ({ a, b, c, winRate, step = 0.033, count = 30, bookSize = 0 }) => {
  const d = a + b + c;
  // 每本張數有設定時，超出範圍的號碼繞回 1..bookSize
  const wrap = (n) => (bookSize > 0 ? ((n - 1) % bookSize + bookSize) % bookSize + 1 : n);

  const rows = [];
  for (let k = 1; k <= count; k++) {
    const n = step * k;
    const multiplier = winRate + n;
    const value = d * multiplier;
    rows.push({
      k,
      n,
      multiplier,
      value,
      low: wrap(Math.floor(value)),
      high: wrap(Math.ceil(value)),
      rounded: wrap(Math.round(value)),
    });
  }
  return { d, rows };
};
