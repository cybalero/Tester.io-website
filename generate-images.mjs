// Generate brand imagery for Tester Tech via kie.ai (Nano Banana).
// Reads API_KEY from .env. Skips files that already exist, so re-running
// is idempotent and only generates what's missing.
//
// Run:  node generate-images.mjs
// Run one:  node generate-images.mjs glasses-card
//
// API:
//   POST https://api.kie.ai/api/v1/jobs/createTask   → { data: { taskId } }
//   GET  https://api.kie.ai/api/v1/jobs/recordInfo?taskId=... → { data: { state, resultJson } }
//   resultJson is a JSON *string* with { resultUrls: [...] }

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'brand_assets', 'generated');
const API = 'https://api.kie.ai/api/v1/jobs';
const MODEL = 'google/nano-banana';

// ── Load API key from .env ───────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) throw new Error('.env not found at ' + envPath);
  const text = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i);
    if (m && !line.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv();
const KEY = env.KIE_API_KEY || env.API_KEY;
if (!KEY) throw new Error('Set KIE_API_KEY (or API_KEY) in .env');

// ── Shared visual language for every prompt ──────────────
// Keeps the generated set cohesive with the site's dark-luxury aesthetic.
const STYLE = [
  'editorial product photography',
  'matte black background',
  'studio lighting with soft gold rim light',
  'shallow depth of field',
  'photoreal, 8k, high detail, cinematic',
  'subtle gold and silver accents',
  'refined luxury tech aesthetic',
].join(', ');

const BG_STYLE = [
  'abstract futuristic tech background',
  'deep charcoal black with warm gold highlights',
  'subtle circuit pattern',
  'fine grain, cinematic depth',
  'editorial, minimal, no text, no logos',
].join(', ');

// ── Sights.html travel editorial — warm natural-light aesthetic ──
// Distinct from Tester Tech: shot-on-film look, soft golden-hour light,
// muted earth tones, editorial magazine composition. No tech, no gadgets.
const SIGHTS_STYLE = [
  'editorial travel photography',
  'soft natural golden-hour light',
  'muted earth-tone palette — bone, rust, moss, ink',
  'shot on medium-format film, fine grain',
  'slow travel magazine aesthetic',
  'composed, patient, atmospheric',
  'no text, no watermarks, no logos',
].join(', ');

// ── The image set ────────────────────────────────────────
// Each entry generates one PNG into brand_assets/generated/<slug>.png.
// image_size values: 1:1, 9:16, 16:9, 3:4, 4:3, 3:2, 2:3, 5:4, 4:5, 21:9, auto
const JOBS = [
  // Category cards — portrait 3:4
  {
    slug: 'glasses-card',
    image_size: '3:4',
    prompt: `A single pair of minimalist smart glasses, matte titanium frame, hovering centered, ${STYLE}. Full product visible, generous negative space around it, no cropping, no people, no text.`,
  },
  {
    slug: 'assistant-card',
    image_size: '3:4',
    prompt: `A tall cylindrical smart speaker assistant, brushed aluminum base with charcoal fabric mesh top, subtle amber LED ring glowing near top, isolated on black, ${STYLE}. Full device visible, generous negative space, no cropping, no text.`,
  },
  {
    slug: 'hub-card',
    image_size: '3:4',
    prompt: `A small white ceramic smart home hub the size of a hockey puck, soft amber glow ring at the base, on a matte black reflective surface, ${STYLE}. Full device visible, dramatic side lighting, no text.`,
  },

  // Feature hero shots — landscape 5:4
  {
    slug: 'glasses-worn',
    image_size: '5:4',
    prompt: `Close-up side portrait of a person wearing black matte smart glasses, titanium temples, a faint green heads-up display reflection inside the lens, dark moody editorial lighting, ${STYLE}. Face slightly obscured, focus on the glasses.`,
  },
  {
    slug: 'assistant-hero',
    image_size: '5:4',
    prompt: `A cylindrical smart speaker, charcoal fabric mesh top half, brushed aluminum base, soft amber LED ring glowing near the top, isolated on matte black, three-quarter angle, dramatic rim light, ${STYLE}.`,
  },
  {
    slug: 'home-sensors',
    image_size: '5:4',
    prompt: `An overhead flat-lay of a small collection of smart home sensor devices — three small white ceramic cubes, two anodized aluminum pucks, one matchbox-sized hub — each with a tiny amber LED indicator, arranged on a matte black surface with precise spacing, ${STYLE}.`,
  },
  {
    slug: 'earbuds-case',
    image_size: '5:4',
    prompt: `Premium wireless earbuds resting inside an open charging case, matte black titanium finish, thin gold accent ring around each bud, on a pure black reflective surface, dramatic side lighting, ${STYLE}.`,
  },

  // Futuristic tech backgrounds — wide 21:9
  {
    slug: 'hero-bg',
    image_size: '21:9',
    prompt: `${BG_STYLE}. Subtle translucent hexagonal grid, faint data-flow lines, a single warm gold bloom off-center, deep black vignette around edges.`,
  },
  {
    slug: 'pillars-bg',
    image_size: '21:9',
    prompt: `${BG_STYLE}. Extremely subtle microchip die-shot texture, silver micro-lines, warm gold accent traces, almost pure black, suitable as a section backdrop behind white text.`,
  },

  // Reusable editorial section illustration — 16:9
  {
    slug: 'tech-texture',
    image_size: '16:9',
    prompt: `${BG_STYLE}. Blurred bokeh of amber LEDs against matte black, extremely shallow depth of field, feels like the inside of a premium audio device, cinematic, ambient.`,
  },

  // ─────────────────────────────────────────────
  // Sights.html — travel editorial imagery
  // ─────────────────────────────────────────────
  {
    slug: 'sights-hero',
    image_size: '21:9',
    prompt: `A sweeping wide landscape of misty Nordic fjords at dawn, low clouds wrapped around mountain shoulders, a single small wooden dock reaching into glassy water, subtle warm sunlight breaking through, ${SIGHTS_STYLE}. Vast negative sky, painterly, peaceful.`,
  },
  {
    slug: 'sights-kyoto',
    image_size: '4:5',
    prompt: `A quiet moss-covered stone path through a Kyoto temple garden at dawn, soft pink cherry blossom petals on the ground, lantern glow in the background, gentle fog, ${SIGHTS_STYLE}. Zen, understated, muted pinks and deep greens.`,
  },
  {
    slug: 'sights-patagonia',
    image_size: '4:5',
    prompt: `Patagonia peaks reflected in a still glacial lake at sunrise, golden alpenglow on the summits, a lone figure in a rust-colored jacket standing at the shore for scale, ${SIGHTS_STYLE}. Grandeur, silence, cool blues against warm rock tones.`,
  },
  {
    slug: 'sights-faroe',
    image_size: '4:5',
    prompt: `Dramatic emerald cliffs of the Faroe Islands meeting grey-blue Atlantic, a thin waterfall tumbling over the edge, a single sheep on a ridge, soft rain-light, ${SIGHTS_STYLE}. Moody, wind-swept, green and slate.`,
  },
  {
    slug: 'sights-marrakech',
    image_size: '4:5',
    prompt: `A sunlit Marrakech riad courtyard at mid-afternoon, ornate tilework, a small citrus tree, cushions and a copper teapot in the foreground, ${SIGHTS_STYLE}. Warm terracotta, cobalt accents, soft shadows.`,
  },
  {
    slug: 'sights-lisbon',
    image_size: '4:5',
    prompt: `A sloping Lisbon street at golden hour, pastel-tile facades, a cream vintage tram mid-frame, hanging laundry lines above, soft light, ${SIGHTS_STYLE}. Nostalgic, warm pinks and yellows.`,
  },
  {
    slug: 'sights-hokkaido',
    image_size: '4:5',
    prompt: `A quiet Hokkaido winter scene, a lone tree standing in a vast snowfield at dawn, pale pink sky, subtle footprints leading away, ${SIGHTS_STYLE}. Minimal, contemplative, bone and blue.`,
  },
  {
    slug: 'sights-journey-1',
    image_size: '16:9',
    prompt: `An editorial wide shot of a lone traveler walking a coastal footpath through tall grass, back to camera, wearing a caramel wool coat, warm late-afternoon sun, ${SIGHTS_STYLE}. Cinematic, slow, reflective.`,
  },
  {
    slug: 'sights-journey-2',
    image_size: '16:9',
    prompt: `A close-up editorial still life of a weathered leather journal, a fountain pen, a pressed wildflower, and a small brass compass on a linen tablecloth, soft window light, ${SIGHTS_STYLE}. Quiet, hand-crafted, tactile.`,
  },
  {
    slug: 'sights-texture',
    image_size: '16:9',
    prompt: `Extreme close-up of hand-made cream-colored paper with subtle torn edges and a few pressed botanical fibers, soft directional light, ${SIGHTS_STYLE}. Suitable as a subtle section background, almost monochrome, warm.`,
  },

  // ─────────────────────────────────────────────
  // Eiffel Tower — blueprint frame (reference for
  // the next scroll animation, same 1:1 framing as
  // the Sagrada sequence so frames stitch cleanly).
  // ─────────────────────────────────────────────
  {
    slug: 'eiffel-blueprint-front',
    image_size: '1:1',
    prompt: `Architectural blueprint line-art drawing of the Eiffel Tower. Strict front elevation, perfectly bilaterally symmetric — the tower's vertical centerline lands on the exact horizontal center of the square frame, with identical negative space on the left and right. The tower occupies roughly 55% of the frame height, giving calm breathing room top and bottom. Thin, precise 1-pixel WHITE technical strokes only — every lattice diagonal, rivet grid, truss member, and platform railing drawn as a clean hairline. No fills, no shading, no gradients, no color other than pure white, no glow. Background is pure #000000 flat black — no paper texture, no grid, no border, no vignette. Include: four splayed legs, the arched base, the first and second observation platforms, the tapering upper shaft, and the antenna at the apex — all strictly aligned on a single vertical axis. Add restrained dimension ticks and leader lines on BOTH the left and right edges, mirrored so the composition stays balanced. No people, no Paris skyline, no clouds, no sky, no text labels, no numbers, no signature, no watermark, no ornamental cartouche. Highly precise, minimalist wireframe look — as if plotted by a drafting pen. Suitable as frame 001 of a build-up animation sequence.`,
  },
  {
    slug: 'eiffel-final-future',
    image_size: '1:1',
    prompt: `A fully built, futuristic re-imagining of the Eiffel Tower — strict front elevation view, perfectly bilaterally symmetric with the tower's vertical centerline on the exact horizontal center of the square frame, identical negative space on the left and right. Match the EXACT SAME FRAMING, height, proportion, and centering as a corresponding architectural blueprint line drawing of the same tower: four splayed legs, arched base, first and second observation platforms, tapering upper shaft, antenna at the apex, occupying roughly 55% of the frame height with calm breathing room top and bottom. Render the structure in dark brushed metallic steel with cool gunmetal tones, every lattice member, rivet, and truss crisply defined. Integrated along the edges of the lattice: thin veins of cyan-to-amber glowing accent light, as if electroluminescent circuitry traces the structure, brightest at the platform rings and the antenna tip. Cinematic rim lighting from behind creates a subtle halo; dramatic side lighting carves the lattice into deep, hard-edged shadows. Pure #000000 flat black background — no Paris skyline, no clouds, no city lights, no ground plane, no reflections, no text, no labels, no people, no signature, no watermark. Sleek, modern, high detail, photoreal, 8k, the final state of a build-up animation. No extra objects, no decorative props.`,
  },
  {
    slug: 'taj-blueprint-front',
    image_size: '1:1',
    prompt: `Architectural blueprint line-art drawing of the Taj Mahal. Strict front elevation, perfectly bilaterally symmetric — the central axis of the main dome lands exactly on the horizontal center of the square frame, with identical mirrored composition on the left and right. Thin, precise 1-pixel WHITE technical strokes only — every arch, iwan, pishtaq, chhatri, finial, inlay panel, and minaret railing drawn as clean hairlines. No fills, no shading, no gradients, no color other than pure white, no glow. Background is pure #000000 flat black — no paper texture, no grid, no ornamental border, no vignette. Include: the raised marble plinth as a simple base line, the main square mausoleum body with the large central iwan arch, the four small chhatris on the corners of the main body, the large central onion dome with its lotus crown and finial, and the four tall symmetric minarets standing on their own square platforms — two on the left, two on the right, each with three tiered balconies and a domed chhatri cap. The entire structure occupies roughly 70% of the frame width, giving calm breathing room top and bottom. Restrained dimension ticks and leader lines mirrored on both the left and right edges so the composition stays balanced. No reflecting pool, no gardens, no cypress trees, no sky, no clouds, no people, no text labels, no numbers, no signature, no watermark. Highly precise, minimalist wireframe look — as if plotted by a drafting pen on a clean mylar sheet. Suitable as frame 001 of a build-up animation sequence, matching the same 1:1 framing convention as a corresponding line drawing.`,
  },
  {
    slug: 'taj-final-future',
    image_size: '1:1',
    prompt: `A fully built, futuristic dark reimagining of the Taj Mahal — strict front elevation view, perfectly bilaterally symmetric with the central dome's vertical axis on the exact horizontal center of the square frame, identical mirrored composition on the left and right. Match the EXACT SAME FRAMING, width, proportion, and centering as a corresponding architectural line drawing of the same monument: raised plinth as a base line, main square mausoleum body with the large central iwan arch, four small corner chhatris, large central onion dome with lotus crown and finial, and four tall symmetric minarets on square platforms (two each side, three tiered balconies, domed chhatri caps). The entire structure occupies roughly 70% of the frame width with calm breathing room top and bottom. Render every surface in deep black polished marble with subtle obsidian-blue undertones, highly reflective but treated so reflections do not break the silhouette. Integrated along the contours of every arch, iwan, dome rim, chhatri ring, and minaret railing: thin veins of cold cyan-to-violet glowing accent light, like electroluminescent inlay tracing the Pietra Dura patterns, brightest at the central dome crown, the iwan outline, and the minaret finials. Cinematic rim lighting from behind the structure creates a faint halo around the dome; dramatic side lighting from the upper right carves the minarets and iwan into deep, hard-edged shadows. Pure #000000 flat black background — no reflecting pool, no gardens, no cypress trees, no Agra skyline, no stars, no clouds, no ground plane, no people, no text, no labels, no signature, no watermark. Sleek, modern, high detail, photoreal, 8k, the final state of a build-up animation. No extra elements, no decorative props.`,
  },
];

// ── HTTP helpers ─────────────────────────────────────────
async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok || json.code !== 200) {
    throw new Error(`POST ${url} → ${res.status}\n${text.slice(0, 800)}`);
  }
  return json.data;
}

async function get(url) {
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${KEY}` } });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok || json.code !== 200) {
    throw new Error(`GET ${url} → ${res.status}\n${text.slice(0, 800)}`);
  }
  return json.data;
}

async function download(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
  return buf.length;
}

// ── One job: create → poll → download ────────────────────
async function runJob(job) {
  const outFile = path.join(OUT_DIR, `${job.slug}.png`);
  if (fs.existsSync(outFile)) {
    console.log(`  ⏭  ${job.slug}  (already exists, skipping)`);
    return;
  }

  console.log(`  →  ${job.slug}  [${job.image_size}]  creating task...`);
  const { taskId } = await post(`${API}/createTask`, {
    model: MODEL,
    input: {
      prompt: job.prompt,
      output_format: 'png',
      image_size: job.image_size,
    },
  });

  console.log(`     taskId=${taskId}  polling...`);
  const deadline = Date.now() + 3 * 60 * 1000; // 3 min max
  let last = '';
  while (Date.now() < deadline) {
    const info = await get(`${API}/recordInfo?taskId=${encodeURIComponent(taskId)}`);
    if (info.state !== last) { console.log(`     state=${info.state}`); last = info.state; }
    if (info.state === 'success') {
      const parsed = JSON.parse(info.resultJson || '{}');
      const urls = parsed.resultUrls || [];
      if (!urls.length) throw new Error('success but no resultUrls: ' + info.resultJson);
      const bytes = await download(urls[0], outFile);
      console.log(`  ✓  ${job.slug}  saved (${(bytes / 1024).toFixed(0)} KB)`);
      return;
    }
    if (info.state === 'fail') {
      throw new Error(`task failed: ${info.failCode} ${info.failMsg}`);
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error(`timed out after 3 min on ${job.slug}`);
}

// ── Main ─────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const only = process.argv[2]; // optional slug filter
  const list = only ? JOBS.filter(j => j.slug === only) : JOBS;
  if (!list.length) {
    console.log(`No job matches "${only}". Available: ${JOBS.map(j => j.slug).join(', ')}`);
    process.exit(1);
  }

  console.log(`Generating ${list.length} image${list.length === 1 ? '' : 's'} → ${path.relative(__dirname, OUT_DIR)}\n`);
  let ok = 0, fail = 0;
  for (const job of list) {
    try {
      await runJob(job);
      ok++;
    } catch (err) {
      fail++;
      console.error(`  ✗  ${job.slug}  ${err.message.split('\n')[0]}`);
      if (process.env.DEBUG) console.error(err);
    }
  }
  console.log(`\nDone. ${ok} ok, ${fail} failed.`);
}

main().catch(err => { console.error(err); process.exit(1); });
