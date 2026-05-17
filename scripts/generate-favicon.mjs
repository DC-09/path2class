/**
 * One-off script to build web/public/favicon.svg by composing the cropped
 * Path2Class logo (web/public/logo.png) on the app's warm beige background.
 *
 * Run: node scripts/generate-favicon.mjs
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const LOGO_PATH = path.join(root, 'web', 'public', 'logo.png');
const OUTPUT = path.join(root, 'web', 'public', 'favicon.svg');

const BG = '#E8E1D0';
const RADIUS = 14;
const SIZE = 64;
const PADDING = 9;

const logoBytes = await fs.readFile(LOGO_PATH);
const logoB64 = logoBytes.toString('base64');

const inner = SIZE - PADDING * 2;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="${RADIUS}" fill="${BG}"/>
  <image x="${PADDING}" y="${PADDING}" width="${inner}" height="${inner}" href="data:image/png;base64,${logoB64}" preserveAspectRatio="xMidYMid meet"/>
</svg>
`;

await fs.writeFile(OUTPUT, svg, 'utf8');
console.log(`✓ Wrote ${path.relative(root, OUTPUT)} (${(svg.length / 1024).toFixed(1)} KB)`);
