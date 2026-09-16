import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { source, extractLiteralBetween, evaluateExpression } from './source-utils.js';

const canonical = evaluateExpression(extractLiteralBetween('const CANONICAL_COLORS=', ';'));
const officialNames = evaluateExpression(extractLiteralBetween('const OFFICIAL_ENCYCLOPEDIA_NAMES=Object.freeze(', ');'));
const official = officialNames.map(name => canonical.find(c => c.name === name)).filter(Boolean);
const radiusMap = evaluateExpression(extractLiteralBetween('const OFFICIAL_REAL_UI_RADIUS_V1080=Object.freeze(', ');'));

const rgb = hex => {
  const n = parseInt(String(hex).slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function extractBalancedObjectAfter(prefix) {
  const start = source.indexOf(prefix);
  if (start < 0) throw new Error(`Prefix not found: ${prefix}`);
  const brace = source.indexOf('{', start + prefix.length);
  if (brace < 0) throw new Error(`Object start not found after: ${prefix}`);
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(brace, i + 1);
    }
  }
  throw new Error(`Unclosed object after: ${prefix}`);
}

const perceptionExpr = extractLiteralBetween('const OfficialDiscoveryPerception=Object.freeze(', ');\n\n// v10.6.9');
const perception = vm.runInNewContext(`(${perceptionExpr})`, {
  clamp, rgb, DISCOVER_DISTANCE: 7.5, Math, Number
});

const adaptiveExpr = extractLiteralBetween('const AdaptiveOfficialDiscovery=Object.freeze(', ');\n\n// v10.8.0');
const adaptive = vm.runInNewContext(`(${adaptiveExpr})`, {
  DISCOVER_DISTANCE: 7.5,
  OFFICIAL_REAL_UI_RADIUS_V1080: radiusMap,
  OFFICIAL_ENCYCLOPEDIA_COLORS: official,
  OfficialDiscoveryPerception: perception,
  rgb, Math, Number, Object
});

const officialRGB = official.map(entry => {
  const [r,g,b] = rgb(entry.hex);
  return {entry,r,g,b};
});
const canonicalRGB = canonical.map(entry => {
  const [r,g,b] = rgb(entry.hex);
  return {entry,r,g,b};
});

// Execute the real v10.8.14 ColorClassification object from index.html.
const classificationExpr = extractBalancedObjectAfter('const ColorClassification=');
const classification = vm.runInNewContext(`(${classificationExpr})`, {
  rgb,
  Math,
  CANONICAL_COLOR_RGB: canonicalRGB,
  OFFICIAL_ENCYCLOPEDIA_COLOR_RGB: officialRGB,
  OfficialDiscoveryPerception: perception,
  AdaptiveOfficialDiscovery: adaptive,
  myDiscoveries: []
});

function nearestOfficial(rr,gg,bb) {
  let entry = null;
  let d2 = Infinity;
  for (const c of officialRGB) {
    const x = (rr-c.r)**2 + (gg-c.g)**2 + (bb-c.b)**2;
    if (x < d2) { d2 = x; entry = c.entry; }
  }
  return {entry, dist: Math.sqrt(d2)};
}

function dangerousPairs(limit = 50) {
  const pairs = [];
  for (let i=0; i<official.length; i++) {
    for (let j=i+1; j<official.length; j++) {
      const A=official[i], B=official[j];
      const a=rgb(A.hex), b=rgb(B.hex);
      const centerDistance=Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
      // Negative gap means the two calibrated RGB spheres geometrically overlap.
      const overlapGap=centerDistance-Number(radiusMap[A.name])-Number(radiusMap[B.name]);
      pairs.push({A,B,a,b,centerDistance,overlapGap});
    }
  }
  pairs.sort((x,y) => x.overlapGap-y.overlapGap || x.centerDistance-y.centerDistance);
  return pairs.slice(0,limit);
}

function segmentProbes(pair, steps = 20) {
  const out=[];
  for(let i=0;i<=steps;i++) {
    const t=i/steps;
    out.push([
      Math.round(pair.a[0]+(pair.b[0]-pair.a[0])*t),
      Math.round(pair.a[1]+(pair.b[1]-pair.a[1])*t),
      Math.round(pair.a[2]+(pair.b[2]-pair.a[2])*t)
    ]);
  }
  return out;
}

const danger50 = dangerousPairs(50);

test('collision: real classifier always attempts the globally nearest official first across 50 highest-overlap pairs', () => {
  assert.equal(danger50.length, 50);
  let probes=0;
  for(const pair of danger50) {
    for(const [r,g,b] of segmentProbes(pair)) {
      const nearest=nearestOfficial(r,g,b);
      const gate=adaptive.evaluate(r,g,b,nearest.entry);
      const actual=classification.nearestStrictOfficialRGB(r,g,b);
      const expectedName=gate.pass ? nearest.entry.name : null;
      assert.equal(
        actual.entry?.name ?? null,
        expectedName,
        `${pair.A.name} ↔ ${pair.B.name} @ rgb(${r},${g},${b}): expected nearest ${expectedName ?? 'none'}, got ${actual.entry?.name ?? 'none'}`
      );
      probes++;
    }
  }
  assert.equal(probes, 50*21);
});

test('collision: overlapping calibrated radii can never make the real classifier return more than one candidate', () => {
  let overlapProbes=0;
  let multiEligible=0;
  for(const pair of danger50) {
    for(const [r,g,b] of segmentProbes(pair)) {
      const eligibleA=adaptive.evaluate(r,g,b,pair.A).pass;
      const eligibleB=adaptive.evaluate(r,g,b,pair.B).pass;
      const eligible=(eligibleA?1:0)+(eligibleB?1:0);
      if(eligible===2) multiEligible++;
      if(eligible===0) continue;
      overlapProbes++;
      const actual=classification.nearestStrictOfficialRGB(r,g,b);
      assert.ok(actual.candidates.length<=1, `${pair.A.name} ↔ ${pair.B.name}: returned ${actual.candidates.length} candidates`);
      if(actual.entry) {
        const nearest=nearestOfficial(r,g,b);
        assert.equal(actual.entry.name, nearest.entry.name, `${pair.A.name} ↔ ${pair.B.name}: non-nearest candidate stole overlap sample`);
      }
    }
  }
  assert.ok(overlapProbes>0, 'danger-pair audit did not exercise any accepted samples');
  assert.ok(multiEligible>=50, `expected meaningful radius overlap coverage, saw only ${multiEligible} multi-eligible probes`);
});

test('collision: the most dangerous pair midpoints never allow a farther official to steal the sample', () => {
  const danger100=dangerousPairs(100);
  let checked=0;
  for(const pair of danger100) {
    const [r,g,b]=segmentProbes(pair,2)[1]; // midpoint
    const nearest=nearestOfficial(r,g,b);
    const actual=classification.nearestStrictOfficialRGB(r,g,b);
    if(actual.entry) {
      assert.equal(actual.entry.name, nearest.entry.name, `${pair.A.name} ↔ ${pair.B.name} midpoint was stolen by ${actual.entry.name}`);
      assert.ok(Math.abs(actual.dist-nearest.dist)<1e-9, `${pair.A.name} ↔ ${pair.B.name}: returned distance drifted`);
      assert.equal(actual.candidates.length,1);
      assert.equal(actual.candidates[0].name,actual.entry.name);
    } else {
      assert.equal(actual.candidates.length,0);
    }
    checked++;
  }
  assert.equal(checked,100);
});
