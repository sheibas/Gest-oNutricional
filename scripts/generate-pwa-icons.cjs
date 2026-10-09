const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure output directory exists
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create high quality SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="50%" stop-color="#09090b"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
    <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fb7185"/>
      <stop offset="40%" stop-color="#e11d48"/>
      <stop offset="100%" stop-color="#9f1239"/>
    </linearGradient>
    <linearGradient id="appleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fecdd3"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="24" flood-color="#e11d48" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- Dark Background with smooth rounded corners -->
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)" stroke="#27272a" stroke-width="8"/>

  <!-- Centered Glowing Emblem Container -->
  <g filter="url(#glow)">
    <rect x="86" y="86" width="340" height="340" rx="90" fill="url(#roseGrad)" stroke="#fda4af" stroke-opacity="0.3" stroke-width="4"/>
  </g>

  <!-- Stylized Apple Graphic -->
  <g transform="translate(146, 136) scale(0.43)" fill="none" stroke="url(#appleGrad)" stroke-width="32" stroke-linecap="round" stroke-linejoin="round">
    <!-- Apple Leaf -->
    <path d="M 280 80 C 290 30, 340 20, 360 40 C 360 90, 310 100, 280 80 Z" fill="#ffffff" stroke="#ffffff" stroke-width="12"/>
    <!-- Apple Body -->
    <path d="M 256 160 C 200 130, 80 160, 80 280 C 80 400, 180 460, 256 460 C 332 460, 432 400, 432 280 C 432 160, 312 130, 256 160 Z" fill="#ffffff" fill-opacity="0.95" stroke="#ffffff" stroke-width="16"/>
    <!-- Inner Heart Curve -->
    <path d="M 256 160 L 256 220" stroke="#e11d48" stroke-width="20"/>
  </g>

  <!-- Mini Dumbbell Accent in Corner -->
  <g transform="translate(320, 320)">
    <circle cx="48" cy="48" r="54" fill="#09090b" stroke="#e11d48" stroke-width="6"/>
    <!-- Dumbbell Icon -->
    <g transform="translate(24, 24) scale(0.95)" fill="none" stroke="#fb7185" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m6.5 6.5 11 11"/>
      <path d="m21 21-1-1"/>
      <path d="m3 3 1 1"/>
      <path d="m18 22 4-4"/>
      <path d="m2 6 4-4"/>
      <path d="m3 10 7-7"/>
      <path d="m14 21 7-7"/>
    </g>
  </g>
</svg>`;

// Save SVG Icon
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent.trim());
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), svgContent.trim());

// Pure PNG generator in Node.js using zlib
function createPng(width, height, drawFn) {
  // RGBA buffer: 4 bytes per pixel + 1 filter byte per scanline
  const rowSize = width * 4;
  const rawBuffer = Buffer.alloc((rowSize + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawBuffer[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawBuffer[pixelOffset] = r;
      rawBuffer[pixelOffset + 1] = g;
      rawBuffer[pixelOffset + 2] = b;
      rawBuffer[pixelOffset + 3] = a;
    }
  }

  // Compress IDAT chunk with Deflate
  const compressed = zlib.deflateSync(rawBuffer);

  // Helper for CRC32
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const toCrc = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(toCrc), 0);

    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA (6)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Pixel shader for NutriPadel Icon
function drawNutriIcon(x, y, w, h) {
  // Normalize coordinates to [-1, 1]
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Rounded background square
  const cornerRadius = 0.45;
  const dx = Math.max(0, Math.abs(nx) - (1 - cornerRadius));
  const dy = Math.max(0, Math.abs(ny) - (1 - cornerRadius));
  const cornerDist = Math.sqrt(dx * dx + dy * dy);

  if (cornerDist > cornerRadius) {
    return [0, 0, 0, 0]; // Transparent outside icon boundary
  }

  // Border glow
  const isBorder = cornerDist > cornerRadius - 0.04 || Math.abs(nx) > 0.94 || Math.abs(ny) > 0.94;
  if (isBorder) {
    return [39, 39, 42, 255]; // zinc-800
  }

  // Central Rose Glow Badge
  const badgeRadius = 0.65;
  const bdx = Math.max(0, Math.abs(nx) - (badgeRadius - 0.3));
  const bdy = Math.max(0, Math.abs(ny) - (badgeRadius - 0.3));
  const badgeDist = Math.sqrt(bdx * bdx + bdy * bdy);

  if (badgeDist < 0.3) {
    // Inside central badge: Rose Gradient (#fb7185 to #9f1239)
    const t = (ny + 0.6) / 1.2;
    const r = Math.round(244 * (1 - t) + 159 * t);
    const g = Math.round(63 * (1 - t) + 18 * t);
    const b = Math.round(94 * (1 - t) + 57 * t);

    // Inner symbol (Apple shape approximation)
    const symX = nx * 1.6;
    const symY = (ny + 0.05) * 1.6;
    const symDist = Math.sqrt(symX * symX + symY * symY);

    // Apple shape equation
    const appleShape = (symX * symX + Math.pow(symY - Math.sqrt(Math.abs(symX)), 2));
    if (appleShape < 0.45) {
      return [255, 255, 255, 255]; // White Apple
    }

    // Leaf
    const leafX = (nx - 0.1) * 3;
    const leafY = (ny + 0.35) * 3;
    if (leafX * leafX + leafY * leafY < 0.15 && leafX > 0 && leafY < 0) {
      return [255, 255, 255, 255];
    }

    return [Math.min(255, r), Math.min(255, g), Math.min(255, b), 255];
  }

  // Dumbbell badge in bottom right corner
  const cnx = nx - 0.52;
  const cny = ny - 0.52;
  const cdist = Math.sqrt(cnx * cnx + cny * cny);
  if (cdist < 0.28) {
    if (cdist > 0.24) return [225, 29, 72, 255]; // Rose ring
    if (cdist < 0.15) return [251, 113, 133, 255]; // Dumbbell center
    return [9, 9, 11, 255]; // Dark inner
  }

  // Dark background gradient
  const bgGrad = Math.round(9 + (1 - dist) * 15);
  return [bgGrad, bgGrad, Math.min(255, bgGrad + 2), 255];
}

// Generate sizes
const sizes = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'icon-maskable-192x192.png', size: 192 },
  { name: 'icon-maskable-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

sizes.forEach(({ name, size }) => {
  const pngBuffer = createPng(size, size, drawNutriIcon);
  fs.writeFileSync(path.join(iconsDir, name), pngBuffer);
  console.log(`Generated: public/icons/${name} (${size}x${size})`);
});

// Also copy apple-touch-icon to public root
fs.copyFileSync(
  path.join(iconsDir, 'apple-touch-icon.png'),
  path.join(__dirname, '..', 'public', 'apple-touch-icon.png')
);

console.log('All PWA icons generated successfully!');
