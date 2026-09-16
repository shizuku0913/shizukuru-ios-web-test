import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { extractLiteralBetween, evaluateExpression } from './source-utils.js';

const canonical = evaluateExpression(extractLiteralBetween('const CANONICAL_COLORS=', ';'));
const officialNames = evaluateExpression(extractLiteralBetween('const OFFICIAL_ENCYCLOPEDIA_NAMES=Object.freeze(', ');'));
const official = officialNames.map(name => canonical.find(c => c.name === name)).filter(Boolean);
const radiusMap = evaluateExpression(extractLiteralBetween('const OFFICIAL_REAL_UI_RADIUS_V1080=Object.freeze(', ');'));

const rgb = hex => {
  const n = parseInt(String(hex).slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const perceptionExpr = extractLiteralBetween('const OfficialDiscoveryPerception=Object.freeze(', ');\n\n// v10.6.9');
const perception = vm.runInNewContext(`(${perceptionExpr})`, {
  clamp, rgb, DISCOVER_DISTANCE: 7.5, Math, Number
});

function nearestOfficial(rr, gg, bb) {
  let best = null;
  let d2 = Infinity;
  for (const entry of official) {
    const [r, g, b] = rgb(entry.hex);
    const x = (rr-r)**2 + (gg-g)**2 + (bb-b)**2;
    if (x < d2) {
      best = entry;
      d2 = x;
    }
  }
  return { entry: best, dist: Math.sqrt(d2) };
}

function adaptivePass(rr, gg, bb, entry) {
  const p = perception.evaluate(rr, gg, bb, entry);
  const radius = Number(radiusMap[entry.name]);
  return { ...p, radius, pass: p.pass && p.rgbDistance <= radius };
}

const neighborhood1 = [];
for (let dr=-1; dr<=1; dr++) {
  for (let dg=-1; dg<=1; dg++) {
    for (let db=-1; db<=1; db++) {
      if (dr || dg || db) neighborhood1.push([dr,dg,db]);
    }
  }
}

test('boundary: every official color is stable across its immediate RGB ±1 neighborhood (9,100 probes)', () => {
  assert.equal(official.length, 350);
  let probes = 0;
  for (const entry of official) {
    const [r,g,b] = rgb(entry.hex);
    for (const [dr,dg,db] of neighborhood1) {
      const rr = clamp(r+dr, 0, 255);
      const gg = clamp(g+dg, 0, 255);
      const bb = clamp(b+db, 0, 255);
      const result = adaptivePass(rr,gg,bb,entry);
      assert.equal(
        result.pass,
        true,
        `${entry.name}: immediate neighbor [${dr},${dg},${db}] rejected (${result.reason}, rgbDistance=${result.rgbDistance}, radius=${result.radius})`
      );
      probes++;
    }
  }
  assert.equal(probes, 350 * 26);
});

test('boundary: immediate RGB ±1 neighborhood is not stolen by another official center (9,100 probes)', () => {
  let probes = 0;
  for (const entry of official) {
    const [r,g,b] = rgb(entry.hex);
    for (const [dr,dg,db] of neighborhood1) {
      const rr = clamp(r+dr, 0, 255);
      const gg = clamp(g+dg, 0, 255);
      const bb = clamp(b+db, 0, 255);
      const nearest = nearestOfficial(rr,gg,bb);
      assert.equal(
        nearest.entry.name,
        entry.name,
        `${entry.name}: immediate neighbor [${dr},${dg},${db}] is closer to ${nearest.entry.name}`
      );
      probes++;
    }
  }
  assert.equal(probes, 350 * 26);
});

test('boundary: probes geometrically outside each calibrated radius cannot pass that official color', () => {
  const axes = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  let checked = 0;
  for (const entry of official) {
    const [r,g,b] = rgb(entry.hex);
    const radius = Number(radiusMap[entry.name]);
    const step = Math.ceil(radius) + 1;
    for (const [ar,ag,ab] of axes) {
      const rr = clamp(r + ar*step, 0, 255);
      const gg = clamp(g + ag*step, 0, 255);
      const bb = clamp(b + ab*step, 0, 255);
      const dist = Math.sqrt((rr-r)**2 + (gg-g)**2 + (bb-b)**2);
      if (dist <= radius) continue; // only assert genuinely outside probes after clamping
      const result = adaptivePass(rr,gg,bb,entry);
      assert.equal(
        result.pass,
        false,
        `${entry.name}: outside probe passed (distance=${dist}, radius=${radius})`
      );
      checked++;
    }
  }
  assert.ok(checked >= 1900, `too few outside-radius probes checked: ${checked}`);
});
