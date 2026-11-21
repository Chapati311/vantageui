/**
 * MD5 (the browser's crypto has no MD5; it's still everywhere in CTFs and
 * file checksums). Classic compact implementation over UTF-8 bytes.
 */
export function md5(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const words: number[] = [];
  for (let i = 0; i < bytes.length; i++) words[i >> 2] |= bytes[i] << ((i % 4) * 8);
  const bitLength = bytes.length * 8;
  words[bitLength >> 5] |= 0x80 << bitLength % 32;
  words[(((bitLength + 64) >>> 9) << 4) + 14] = bitLength;
  const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) | 0);
  let [a0, b0, c0, d0] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  const add = (x: number, y: number) => (x + y) | 0;
  const rol = (x: number, c: number) => (x << c) | (x >>> (32 - c));
  for (let block = 0; block < words.length; block += 16) {
    let [a, b, c, d] = [a0, b0, c0, d0];
    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) [f, g] = [(b & c) | (~b & d), i];
      else if (i < 32) [f, g] = [(d & b) | (~d & c), (5 * i + 1) % 16];
      else if (i < 48) [f, g] = [b ^ c ^ d, (3 * i + 5) % 16];
      else [f, g] = [c ^ (b | ~d), (7 * i) % 16];
      const temp = d;
      d = c;
      c = b;
      b = add(b, rol(add(add(a, f), add(K[i], words[block + g] | 0)), S[(i >> 4) * 4 + (i % 4)]));
      a = temp;
    }
    [a0, b0, c0, d0] = [add(a0, a), add(b0, b), add(c0, c), add(d0, d)];
  }
  return [a0, b0, c0, d0].map((n) => Array.from({ length: 4 }, (_, i) => ((n >>> (i * 8)) & 255).toString(16).padStart(2, '0')).join('')).join('');
}
