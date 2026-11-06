import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EV = path.join(ROOT, 'test-evidence');
fs.mkdirSync(EV, { recursive: true });

function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return fallback; }
}

const results = readJson(path.join(EV, 'playwright-results.json'), { suites: [] });
const hits = readJson(path.join(EV, 'hit-measurements.json'), null);
const load = readJson(path.join(EV, 'load-metrics.json'), null);
const cycle = readJson(path.join(EV, 'full-cycle-summary.json'), null);

function flatten(suite, out = []) {
  for (const s of suite.suites || []) flatten(s, out);
  for (const spec of suite.specs || []) {
    for (const t of spec.tests || []) {
      const r = (t.results || [])[0] || {};
      out.push({
        title: spec.title,
        status: t.outcome || r.status || 'unknown',
        ok: (t.outcome || r.status) === 'expected' || r.status === 'passed'
      });
    }
  }
  return out;
}
const rows = flatten(results);
const passed = rows.filter((r) => r.ok).length;
const failed = rows.length - passed;

function listImgs(dir, prefix) {
  const abs = path.join(EV, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs)
    .filter((f) => f.endsWith('.png') || f.endsWith('.jpg'))
    .map((f) => prefix + f);
}

const deviceShots = listImgs('devices', 'devices/');
const cycleShots = listImgs('full-cycle', 'full-cycle/');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Haven's Garden — hardening evidence</title>
<style>
  body{font-family:system-ui,sans-serif;margin:24px;max-width:1100px;color:#1e1814;background:#f7f0e4}
  h1,h2{font-family:Georgia,serif}
  table{border-collapse:collapse;width:100%;margin:12px 0 28px}
  th,td{border:1px solid #cbb8a0;padding:8px 10px;text-align:left;font-size:14px}
  th{background:#efe4d4}
  .pass{color:#1a7a3c;font-weight:700}
  .fail{color:#b00020;font-weight:700}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
  figure{margin:0;background:#fff;border:1px solid #cbb8a0;padding:8px}
  img{width:100%;height:auto;display:block}
  figcaption{font-size:12px;margin-top:6px;color:#4a4034}
  code{background:#efe4d4;padding:1px 4px;border-radius:4px}
  .note{background:#fff8e8;border-left:4px solid #c07018;padding:10px 14px;margin:16px 0}
</style>
</head>
<body>
<h1>Haven's Garden birthday preview — hardening evidence</h1>
<p><strong>VER</strong> <code>v0.9-birthday-harden</code> · pack <code>greenhouse-redo-v2</code> ·
SHA-256 <code>21e0a31e435086a4f92b3d0d875143779c7921ca8637d7bf114ca92a6208ebec</code></p>
<p>Generated ${new Date().toISOString()}</p>

<div class="note"><strong>Device limitation:</strong> phone profiles are <em>Playwright-emulated</em>
(iPhone SE / 14 / Pixel 7 / small Android / iPad). Not a real-device cloud lab.</div>

<h2>Test results (${passed}/${rows.length} pass)</h2>
<table>
<tr><th>Test</th><th>Result</th></tr>
${rows.map((r) => `<tr><td>${r.title}</td><td class="${r.ok ? 'pass' : 'fail'}">${r.ok ? 'PASS' : 'FAIL'}</td></tr>`).join('\n') || '<tr><td colspan="2">No playwright-results.json yet — run npm test</td></tr>'}
</table>

<h2>Hit measurements @390 (honest)</h2>
<p>Candidate bounds are 66 native → ~44 CSS, but they <strong>overlap</strong>. Exclusive sizes are Voronoi half-distances — not 44px.</p>
<pre>${hits ? JSON.stringify({
  small: { overlaps: hits.small.overlapPairs, candidateCss: hits.small.candidateCss, exclusiveMin: hits.small.exclusiveCssMin, exclusiveMedian: hits.small.exclusiveCssMedian, below44: hits.small.below44 },
  large: { overlaps: hits.large.overlapPairs, candidateCss: hits.large.candidateCss, exclusiveMin: hits.large.exclusiveCssMin, exclusiveMedian: hits.large.exclusiveCssMedian, below44: hits.large.below44 },
  outdoor: { overlaps: hits.outdoor.overlapPairs, exclusiveMin: hits.outdoor.exclusiveCssMin, below44: hits.outdoor.below44 }
}, null, 2) : 'pending'}</pre>

<h2>Load metrics</h2>
<pre>${load ? JSON.stringify(load, null, 2) : 'pending'}</pre>

<h2>Full-cycle summary</h2>
<pre>${cycle ? JSON.stringify(cycle, null, 2) : 'pending'}</pre>

<h2>Full-cycle screenshots</h2>
<div class="grid">
${cycleShots.map((s) => `<figure><img src="${s}" alt=""/><figcaption>${s}</figcaption></figure>`).join('\n') || '<p>none yet</p>'}
</div>

<h2>Device screenshots (emulated)</h2>
<div class="grid">
${deviceShots.map((s) => `<figure><img src="${s}" alt=""/><figcaption>${s}</figcaption></figure>`).join('\n') || '<p>none yet</p>'}
</div>

<h2>Migration fixtures</h2>
<p>Covered in automated tests: <code>havensGarden.v1</code> multi-mix beds, root economy fields, jars/honey/bees/owned → <code>havensGarden.birthday.v2</code> with no flower/coin/jar loss.</p>

<p><a href="playwright-results.json">playwright-results.json</a> ·
<a href="hit-measurements.json">hit-measurements.json</a> ·
<a href="load-metrics.json">load-metrics.json</a></p>
</body>
</html>`;

fs.writeFileSync(path.join(EV, 'index.html'), html);
console.log('wrote', path.join(EV, 'index.html'), 'tests', rows.length, 'pass', passed, 'fail', failed);
process.exit(failed ? 1 : 0);
