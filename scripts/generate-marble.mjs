// Writes the site's marble images. Geometry follows Boring Avatars (MIT):
// https://github.com/boringdesigners/boring-avatars
import { mkdirSync, writeFileSync } from "node:fs";

const SEEDS = [
  "lake",
  "mountains",
  "coast",
  "forest",
  "night",
  "woods",
  "dune",
  "meadow",
];
const PALETTES = [
  ["#f4a6a0", "#f6d28b", "#8fcfb1", "#7fa8e8", "#a891e0"],
  ["#ee8f74", "#f3c463", "#7cc3a1", "#5f8fd6", "#9b7fd3"],
  ["#f29bb4", "#f7cf8a", "#93d3c1", "#80a9ef", "#b39be6"],
  ["#f0a07c", "#efd79a", "#a3cf8e", "#6fb3d9", "#8d8fdf"],
];

function random(seed) {
  let state = 0;
  for (const char of seed)
    state =
      (Math.imul(state ^ char.charCodeAt(0), 2654435761) + 0x9e3779b9) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function marble(seed, index) {
  const rand = random(seed);
  const palette = PALETTES[index % PALETTES.length];
  const start = (index * 2) % palette.length;
  const [a, b, c] = [0, 1, 3].map(
    (offset) => palette[(start + offset) % palette.length],
  );
  const move = () =>
    `translate(${((rand() - 0.5) * 16).toFixed(1)} ${((rand() - 0.5) * 16).toFixed(1)}) rotate(${Math.round(rand() * 360)} 40 30) scale(${(1.2 + rand() * 0.4).toFixed(2)})`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 80 60"><title>Marble texture</title><defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter></defs><rect width="80" height="60" fill="${a}"/><g transform="translate(0 -10)"><path filter="url(#b)" d="M32.414 59.35L50.376 70.5H72.5v-71H33.728L26.5 13.381l19.057 27.08L32.414 59.35z" fill="${b}" transform="${move()}"/><path filter="url(#b)" style="mix-blend-mode:overlay" d="M22.216 24L0 46.75l14.108 38.129L78 86l-3.081-59.276-22.378 4.005 12.972 20.186-23.35 27.395L22.215 24z" fill="${c}" transform="${move()}"/></g></svg>\n`;
}

const out = new URL("../apps/site/public/images/", import.meta.url);
mkdirSync(out, { recursive: true });
SEEDS.forEach((seed, index) => {
  writeFileSync(new URL(`marble-${seed}.svg`, out), marble(seed, index));
});
