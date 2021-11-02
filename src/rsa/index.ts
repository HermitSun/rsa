import BigInteger from "./bigint";
import BigPrime from "./bigprime";

export interface PublicKey {
  n: bigint;
  p: bigint;
  q: bigint;
  e: bigint;
}

export interface PrivateKey {
  d: bigint;
}

/**
 * 生成 RSA 公私钥
 * 在实践中 e = 3 or e = 65537
 * @see https://blog.csdn.net/hherima/article/details/52461759
 * @param l 密钥位数
 * @param e
 */
function genKeyPair(l: number, e = 65537n): [PublicKey, PrivateKey] {
  const pL = l >> 1;
  const qL = l - pL;
  const p = BigPrime.randomPrimeBits(pL),
    q = BigPrime.randomPrimeBits(qL);
  const n = p * q;
  const phi = n - p - q + 1n;
  const d = BigInteger.modInverse(e, phi);
  return [{ n, p, q, e }, { d }];
}

/**
 * 字符串加密，
 * 长度为 1024 位的密钥可以加密 127 字节的字符串，按比例推算，但是为什么呢？
 * @param s 字符串
 * @param pubKey RSA 公钥
 */
function encrypt(s: string, { n, e = 65537n }: PublicKey): bigint {
  // 原始字符串变成大整数
  // CHECKME: 假设是 ASCII
  // 需要给 10 以下的 16 进制数填充额外的 0
  const sInt = BigInt(
    "0x" +
      [...s].map((c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
  );
  return BigInteger.modPow(sInt, e, n);
}

//
/**
 * 字符串解密
 * @param c 收到的密文
 * @param prvKey RSA 私钥
 * @param pubKey RSA 公钥
 */
function decrypt(c: bigint, { d }: PrivateKey, { p, q }: PublicKey) {
  // 使用 Euler's Theorem & CRT 加速
  const phiP = p - 1n,
    x1 = BigInteger.modPow(c, d % phiP, p),
    phiQ = q - 1n,
    x2 = BigInteger.modPow(c, d % phiQ, q);
  // const mHex = BigInteger.modPow(c, d, n).toString(16);
  const mHex = BigInteger.crt([x1, x2], [p, q]).toString(16);
  return (
    mHex
      // 两个 bit 为单位分组
      .split(/(?=(?:..)*$)/)
      .map((c) => String.fromCharCode(parseInt(c, 16)))
      .join("")
  );
}

export default {
  genKeyPair,
  encrypt,
  decrypt,
};
