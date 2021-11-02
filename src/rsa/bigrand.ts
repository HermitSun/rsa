import BigInteger from "./bigint";

/**
 * 生成指定位数的随机数
 * @param bits
 */
function randomIntBits(bits: number): bigint {
  return BigInt(
    "0b" +
      Array.from({ length: bits }, () => Math.round(Math.random())).join("")
  );
}

//
/**
 * 生成 [a, b] 内的随机数
 * @param a
 * @param b
 */
function randomIntRange(a: bigint, b: bigint): bigint {
  const between = b - a;
  let r = randomIntBits(BigInteger.bitLength(between));
  while (r > between) {
    r = randomIntBits(BigInteger.bitLength(between));
  }
  return a + r;
}

export default {
  randomIntBits,
  randomIntRange,
};
