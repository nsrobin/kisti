#!/usr/bin/env node
// Writes the five §15.3 UI sounds as 16-bit mono 44.1 kHz WAV files. No dependencies.
// Sine and triangle waves with exponential-decay envelopes; original, so no licensing issues.
// Usage: node scripts/generate-sounds.mjs
// Writes to src/assets/sounds (linked into the iOS bundle) and Android's res/raw.
import fs from 'node:fs';
import path from 'node:path';

const RATE = 44100;
const OUT_DIRS = ['src/assets/sounds', 'android/app/src/main/res/raw'];

const sine = (f, t) => Math.sin(2 * Math.PI * f * t);
const triangle = (f, t) => (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * f * t));

/** A tone: wave, frequency (Hz, may glide to `to`), start/length (s), decay rate, gain. */
function tone({ wave = sine, f, to = f, at = 0, len, decay, gain = 1 }) {
  return t => {
    const local = t - at;
    if (local < 0 || local > len) return 0;
    const freq = f + (to - f) * (local / len);
    const attack = Math.min(1, local / 0.002); // 2 ms attack avoids clicks
    const release = Math.min(1, (len - local) / 0.004);
    return wave(freq, local) * Math.exp(-decay * local) * attack * release * gain;
  };
}

const SOUNDS = {
  tap: {
    ms: 30,
    parts: [
      tone({ wave: triangle, f: 1800, to: 900, len: 0.03, decay: 160, gain: 0.9 }),
      tone({ f: 420, len: 0.03, decay: 120, gain: 0.5 }),
    ],
  },
  toggle: { ms: 80, parts: [tone({ f: 660, len: 0.04, decay: 60 }), tone({ f: 990, at: 0.04, len: 0.04, decay: 60 })] },
  stitch: { ms: 40, parts: [tone({ wave: triangle, f: 3200, to: 2600, len: 0.04, decay: 140, gain: 0.7 })] },
  success: {
    ms: 280,
    parts: [
      tone({ f: 784, len: 0.14, decay: 18 }),
      tone({ f: 1175, at: 0.11, len: 0.17, decay: 14 }),
      tone({ f: 2350, at: 0.11, len: 0.17, decay: 30, gain: 0.15 }),
    ],
  },
  warn: {
    ms: 160,
    parts: [
      tone({ wave: triangle, f: 300, len: 0.07, decay: 30 }),
      tone({ wave: triangle, f: 260, at: 0.085, len: 0.075, decay: 30 }),
    ],
  },
};

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

OUT_DIRS.forEach(d => fs.mkdirSync(d, { recursive: true }));
let total = 0;
for (const [name, { ms, parts }] of Object.entries(SOUNDS)) {
  const n = Math.round((RATE * ms) / 1000);
  const raw = Array.from({ length: n }, (_, i) => parts.reduce((s, p) => s + p(i / RATE), 0));
  const peak = Math.max(...raw.map(Math.abs)) || 1;
  const buf = wav(raw.map(s => (s / peak) * 0.8)); // normalise; playback volume is capped at 35% in-app
  const file = path.join(OUT_DIRS[0], `${name}.wav`);
  OUT_DIRS.forEach(d => fs.writeFileSync(path.join(d, `${name}.wav`), buf));
  total += buf.length;
  if (buf.length >= 30 * 1024) throw new Error(`${file} is over 30 KB`);
  console.log(`${file}  ${ms} ms  ${(buf.length / 1024).toFixed(1)} KB`);
}
console.log(`total ${(total / 1024).toFixed(1)} KB (budget 150 KB)`);
