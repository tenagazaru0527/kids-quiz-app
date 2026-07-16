// PWA用アイコンを外部ライブラリなしで生成するスクリプト
// 実行: node scripts/generate-icons.mjs
// デザイン: 紺色の角丸背景に、早押しボタンをイメージした4色の丸
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

const BG = [0x19, 0x1a, 0x33]; // #191A33
const PLAYERS = [
  [0xff, 0x5d, 0x6c], // 赤(左上)
  [0x4d, 0xa3, 0xff], // 青(右上)
  [0xff, 0xc2, 0x4d], // 黄(左下)
  [0x4d, 0xe0, 0x8a], // 緑(右下)
];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(size, pixels /* RGBA Uint8Array */) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  // 行頭にフィルタバイト0を挿入
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function drawIcon(size, { rounded }) {
  const px = Buffer.alloc(size * size * 4);
  const c = size / 2;
  const cornerR = size * 0.22; // 角丸半径
  // 4つのボタンの中心とサイズ
  const off = size * 0.26;
  const dotR = size * 0.155;
  const centers = [
    [c - off, c - off, PLAYERS[0]],
    [c + off, c - off, PLAYERS[1]],
    [c - off, c + off, PLAYERS[2]],
    [c + off, c + off, PLAYERS[3]],
  ];

  const inRoundedRect = (x, y) => {
    if (!rounded) return true;
    const dx = Math.max(cornerR - x, x - (size - 1 - cornerR), 0);
    const dy = Math.max(cornerR - y, y - (size - 1 - cornerR), 0);
    return dx * dx + dy * dy <= cornerR * cornerR;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      if (!inRoundedRect(x, y)) {
        px[i + 3] = 0; // 角丸の外は透明
        continue;
      }
      let [r, g, b] = BG;
      for (const [cx, cy, col] of centers) {
        const d = Math.hypot(x - cx, y - cy);
        if (d <= dotR) {
          // ふちを白く(ボタンらしく)
          if (d >= dotR - size * 0.018) [r, g, b] = [255, 255, 255];
          else [r, g, b] = col;
          break;
        }
      }
      px[i] = r;
      px[i + 1] = g;
      px[i + 2] = b;
      px[i + 3] = 255;
    }
  }
  return encodePNG(size, px);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "icon-192.png"), drawIcon(192, { rounded: true }));
writeFileSync(join(OUT_DIR, "icon-512.png"), drawIcon(512, { rounded: true }));
// iOSのapple-touch-iconは角丸をOS側が付けるので、こちらは正方形(不透明)
writeFileSync(join(OUT_DIR, "apple-touch-icon.png"), drawIcon(180, { rounded: false }));
console.log("icons generated in", OUT_DIR);
