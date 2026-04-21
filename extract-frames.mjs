import ffmpegPath from 'ffmpeg-static';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const run = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VIDEO = path.join(__dirname, 'Smart Watch Dissection.mp4');
const OUT_DIR = path.join(__dirname, 'brand_assets', 'watch-frames');
const FRAME_COUNT = 24;        // 24 frames across 5.04s → one every ~0.21s
const WIDTH = 1000;            // fixed width for consistency
const QUALITY = 82;            // WebP quality 0–100

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Probe duration with ffmpeg-static (format + parse)
const { stderr } = await run(ffmpegPath, ['-i', VIDEO, '-hide_banner'], { reject: false }).catch(e => ({ stderr: e.stderr || '' }));
const m = /Duration:\s*(\d{2}):(\d{2}):(\d{2}\.\d+)/.exec(stderr);
const duration = m ? (+m[1] * 3600 + +m[2] * 60 + +m[3]) : 5.04;
console.log(`Video duration: ${duration.toFixed(2)}s — extracting ${FRAME_COUNT} frames`);

// Extract N frames evenly distributed
// Use a small inset (0.02s) to avoid seeking before first keyframe
for (let i = 0; i < FRAME_COUNT; i++) {
  const t = 0.02 + (duration - 0.08) * (i / (FRAME_COUNT - 1));
  const outFile = path.join(OUT_DIR, `frame-${String(i + 1).padStart(2, '0')}.webp`);
  await run(ffmpegPath, [
    '-ss', t.toFixed(3),
    '-i', VIDEO,
    '-frames:v', '1',
    '-vf', `scale=${WIDTH}:-2:flags=lanczos`,
    '-q:v', String(QUALITY),
    '-y',                      // overwrite
    outFile,
  ]);
  process.stdout.write(`  frame ${i + 1}/${FRAME_COUNT} @ ${t.toFixed(2)}s\r`);
}
console.log('\n  ' + FRAME_COUNT + ' frames written to brand_assets/watch-frames/');

// Report total size
const total = fs.readdirSync(OUT_DIR)
  .filter(f => f.endsWith('.webp'))
  .reduce((sum, f) => sum + fs.statSync(path.join(OUT_DIR, f)).size, 0);
console.log(`  total size: ${(total / 1024).toFixed(1)} KB`);
