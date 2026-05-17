/**
 * One-off script to generate the QR code SVG with the Path2Class logo
 * embedded at the centre. Outputs to docs/qr-elevator.svg.
 *
 * Run: node scripts/generate-qr.mjs
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const URL = 'https://path2class.vercel.app/?loc=entrance_corridor_2w';
const OUTPUT = path.join(root, 'docs', 'qr-elevator.svg');
const LOGO_PATH = path.join(root, 'web', 'public', 'logo.png');

// High error correction so the QR still scans with the logo covering ~20% of it
const qrSvg = await QRCode.toString(URL, {
  type: 'svg',
  errorCorrectionLevel: 'H',
  margin: 2,
  width: 1000,
  color: { dark: '#1E3A5F', light: '#FFFFFF' },
});

const logoBytes = await fs.readFile(LOGO_PATH);
const logoB64 = logoBytes.toString('base64');

// The qrcode lib outputs `<svg ... viewBox="0 0 N N">…</svg>`.
const viewBoxMatch = qrSvg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
if (!viewBoxMatch) throw new Error('Could not parse QR viewBox');
const size = parseFloat(viewBoxMatch[1]);

// Logo occupies ~22% of the QR width, centred. White rounded rect behind it
// so the underlying QR modules don't bleed through.
const logoSize = size * 0.20;
const padSize = logoSize * 1.15;
const cx = size / 2;
const cy = size / 2;

const overlay = `
  <rect x="${cx - padSize / 2}" y="${cy - padSize / 2}" width="${padSize}" height="${padSize}" rx="${padSize * 0.18}" fill="#FFFFFF"/>
  <image x="${cx - logoSize / 2}" y="${cy - logoSize / 2}" width="${logoSize}" height="${logoSize}" href="data:image/png;base64,${logoB64}" preserveAspectRatio="xMidYMid meet"/>
`;

const finalSvg = qrSvg.replace('</svg>', `${overlay}</svg>`);

await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
await fs.writeFile(OUTPUT, finalSvg, 'utf8');

console.log(`✓ Wrote ${path.relative(root, OUTPUT)} (${(finalSvg.length / 1024).toFixed(1)} KB)`);
console.log(`  Encodes: ${URL}`);
