import fs from 'node:fs';

const POLYFILL = `
// Polyfill Map/WeakMap upsert methods for iPad Safari < 17.4 (pdf.js 5.x needs these).
if (typeof Map !== 'undefined') {
  const p = Map.prototype;
  if (!p.getOrInsert) p.getOrInsert = function (k, v) { if (this.has(k)) return this.get(k); this.set(k, v); return v; };
  if (!p.getOrInsertComputed) p.getOrInsertComputed = function (k, fn) { if (this.has(k)) return this.get(k); const v = fn(k); this.set(k, v); return v; };
}
if (typeof WeakMap !== 'undefined') {
  const p = WeakMap.prototype;
  if (!p.getOrInsert) p.getOrInsert = function (k, v) { if (this.has(k)) return this.get(k); this.set(k, v); return v; };
  if (!p.getOrInsertComputed) p.getOrInsertComputed = function (k, fn) { if (this.has(k)) return this.get(k); const v = fn(k); this.set(k, v); return v; };
}
`;

const src = 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs';
const dst = 'public/pdf.worker.min.mjs';

if (!fs.existsSync(src)) {
  console.warn(`[copy-pdf-worker] source not found: ${src}`);
  process.exit(0);
}

const worker = fs.readFileSync(src, 'utf8');
fs.mkdirSync('public', { recursive: true });
fs.writeFileSync(dst, POLYFILL + '\n' + worker);
console.log(`[copy-pdf-worker] wrote ${dst} (with Safari polyfill)`);
