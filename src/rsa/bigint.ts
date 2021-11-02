/**
 * 大数运算 API
 * 假设都是正整数
 */

/**
 * 获取大整数的位数
 * @param n
 */
function bitLength(n: bigint): number {
  let bits = 1;
  while (n > 1n) {
    ++bits;
    n >>= 1n;
  }
  return bits;
}

/**
 * 扩展欧几里得算法的迭代版本，相当于 ax + by = r
 * @param a
 * @param b
 */
function exGcd(a: bigint, b: bigint): [bigint, bigint, bigint] {
  let x = 0n,
    y = 1n,
    u = 1n,
    v = 0n;
  while (a !== 0n) {
    const q = b / a,
      r = b % a,
      m = x - u * q,
      n = y - v * q;
    b = a;
    a = r;
    x = u;
    y = v;
    u = m;
    v = n;
  }
  return [x, y, b];
}

// 递归版本
// function exGcd(a: bigint, b: bigint): [bigint, bigint] {
//   if (b === 0n) {
//     return [1n, 0n];
//   }
//   const yx = exGcd(b, a % b);
//   const x = yx[1],
//     y = yx[0] - (a / b) * x;
//   return [x, y];
// }

/**
 * 欧几里得算法
 * @param a
 * @param b
 */
function gcd(a: bigint, b: bigint) {
  while (b !== 0n) {
    const r = a % b;
    a = b;
    b = r;
  }
  return a;
}

/**
 * 平衡欧几里得算法
 * @param a
 * @param b
 */
function bGcd(a: bigint, b: bigint) {
  if (b === 0n) return a;
  let r = a % b;
  if (r > 2n * b) r = b - r;
  return gcd(b, r);
}

/**
 * 中国剩余定理，求解同余方程组，
 * k mod m1 = x1, k mod m2 = x2, ..., k mod m_n = x_n
 * @param arr_x [x1, x2, ..., x_n]
 * @param arr_m [m1, m2, ..., m_n]
 */
function crt(arr_x: bigint[], arr_m: bigint[]): bigint {
  let m = 1n;
  for (let i = 0; i < arr_m.length; ++i) {
    m *= arr_m[i];
  }
  let x = 0n;
  for (let i = 0; i < arr_m.length; ++i) {
    const m_i = m / arr_m[i];
    const n_i = modInverse(m_i, arr_m[i]);
    x += arr_x[i] * m_i * n_i;
  }
  return x % m;
}

/**
 * 获取某个大整数最低位的 1 所在的位置，
 * 主要是用于 Miller-Rabin， n - 1 = 2^s * d
 * @param n
 */
function lowestSetBit(n: bigint): number {
  let i = 0;
  while (n % 2n === 0n) {
    ++i;
    n >>= 1n;
  }
  return i;
}

/**
 * n mod m 的乘法逆元
 * @param n
 * @param m
 */
function modInverse(n: bigint, m: bigint): bigint {
  const uv = exGcd(n, m);
  let u = uv[0];
  if (u < 0) {
    u += m;
  }
  return u;
}

/**
 * 求解 n^e mod m，使用快速幂
 * @param n
 * @param e
 * @param m
 */
function modPow(n: bigint, e: bigint, m: bigint): bigint {
  let p = 1n;
  while (e > 0n) {
    if (e % 2n === 1n) {
      p = (p * n) % m;
    }
    e >>= 1n;
    n = n ** 2n % m;
  }
  return p;
}

export default {
  bitLength,
  crt,
  exGcd,
  lowestSetBit,
  modInverse,
  modPow,
};
