const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function createPng(width, height, isMaskable = false) {
  // RGBA raw buffer
  // Each scanline begins with a filter-type byte (0 = None)
  const lineSize = 1 + width * 4;
  const rawData = Buffer.alloc(lineSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = isMaskable ? width * 0.42 : width * 0.46;
  const innerRadius = radius * 0.7;

  for (let y = 0; y < height; y++) {
    const lineOffset = y * lineSize;
    rawData[lineOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = lineOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep Indigo to Violet Gradient background
      const t = (x + y) / (width + height);
      let r = Math.round(49 + t * (99 - 49)); // #312e81 to #6366f1
      let g = Math.round(46 + t * (102 - 46));
      let b = Math.round(129 + t * (241 - 129));
      let a = 255;

      // Rounded outer mask if not maskable
      if (!isMaskable) {
        const cornerRadius = width * 0.22;
        const cornerDistX = Math.max(0, Math.abs(dx) - (cx - cornerRadius));
        const cornerDistY = Math.max(0, Math.abs(dy) - (cy - cornerRadius));
        const cornerDist = Math.sqrt(cornerDistX * cornerDistX + cornerDistY * cornerDistY);
        if (cornerDist > cornerRadius) {
          a = 0; // Transparent outside rounded corner
        }
      }

      // Draw academic cap / diamond crest in center
      if (a > 0) {
        // Center diamond / graduation motif
        const diamondDist = (Math.abs(dx) / (radius * 0.75)) + (Math.abs(dy) / (radius * 0.5));
        if (diamondDist < 1.0) {
          // White to gold center emblem
          if (dy < 0) {
            r = 255; g = 255; b = 255; // White cap top
          } else if (dy > 0 && Math.abs(dx) < radius * 0.35) {
            r = 224; g = 231; b = 255; // Light indigo base
          }
        }
        // Gold tassel accent
        if (dx > radius * 0.35 && dx < radius * 0.48 && dy > -radius * 0.1 && dy < radius * 0.4) {
          r = 251; g = 191; b = 36; // Amber gold
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Compress IDAT
  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: 0 (deflate)
  ihdr[11] = 0; // Filter: 0 (standard)
  ihdr[12] = 0; // Interlace: 0 (none)

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);

  chunk.writeUInt32BE(len, 0);
  typeBuf.copy(chunk, 4);
  data.copy(chunk, 8);

  const crcData = Buffer.concat([typeBuf, data]);
  const crc = calculateCrc(crcData);
  chunk.writeUInt32BE(crc, 8 + len);

  return chunk;
}

// CRC32 calculation table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function calculateCrc(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PWA icons
console.log('Generating PWA icons...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(48, 48, false));

console.log('Successfully generated all PWA icons in /public:');
console.log('- pwa-192x192.png');
console.log('- pwa-512x512.png');
console.log('- pwa-maskable-512x512.png');
console.log('- apple-touch-icon.png');
console.log('- favicon.ico');
