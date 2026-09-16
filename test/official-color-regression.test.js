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
const clamp = (v,a,b) => Math.max(a, Math.min(b,v));

const perceptionExpr = extractLiteralBetween('const OfficialDiscoveryPerception=Object.freeze(', ');\n\n// v10.6.9');
const perception = vm.runInNewContext(`(${perceptionExpr})`, { clamp, rgb, DISCOVER_DISTANCE: 7.5, Math, Number });

function nearestOfficial(rr,gg,bb){
  let best=null, d2=Infinity;
  for(const entry of official){
    const [r,g,b]=rgb(entry.hex);
    const x=(rr-r)**2+(gg-g)**2+(bb-b)**2;
    if(x<d2){best=entry;d2=x;}
  }
  return {entry:best,dist:Math.sqrt(d2)};
}

function adaptivePass(rr,gg,bb,entry){
  const p=perception.evaluate(rr,gg,bb,entry);
  const radius=Number(radiusMap[entry.name]);
  return { ...p, radius, pass:p.pass && p.rgbDistance<=radius };
}

test('all 350 published official centers identify themselves and pass the perceptual gate', () => {
  assert.equal(official.length,350);
  for(const entry of official){
    const [r,g,b]=rgb(entry.hex);
    const nearest=nearestOfficial(r,g,b);
    assert.equal(nearest.entry.name, entry.name, `${entry.name}: another official center stole the exact sample`);
    const result=adaptivePass(r,g,b,entry);
    assert.equal(result.pass,true,`${entry.name}: exact center rejected (${result.reason})`);
  }
});

test('all 350 calibrated official radii are finite and positive', () => {
  assert.equal(Object.keys(radiusMap).length,350);
  for(const entry of official){
    const radius=Number(radiusMap[entry.name]);
    assert.ok(Number.isFinite(radius) && radius>0, `${entry.name}: invalid radius ${radius}`);
  }
});

test('regression: visibly green samples cannot pass red/matcha-like unrelated official entries', () => {
  const green=[31,177,65];
  for(const name of ['あか','ピンク','むらさき','ちくわいろ','たまごやきいろ']){
    const entry=official.find(x=>x.name===name);
    assert.ok(entry,`missing ${name}`);
    assert.equal(adaptivePass(...green,entry).pass,false,`${name} incorrectly accepted a green sample`);
  }
});

test('completion classification requires visible and source models to agree on the same official name', () => {
  assert.match(source,/if\(visibleClassification\.kind==='official'\)/);
  assert.match(source,/if\(!sourceName \|\| sourceName!==visibleName\)/);
  assert.match(source,/discoveryGuard:'visible-source-disagree'/);
});

test('water/recipe regression: completion snapshot reads a fresh mixing snapshot before classification', () => {
  const snapshotStart=source.indexOf('snapshot(){', source.indexOf('const CompletionDiscoveryLifecycle='));
  const commitStart=source.indexOf('commit(state=this.snapshot())', snapshotStart);
  assert.ok(snapshotStart>=0 && commitStart>snapshotStart);
  const body=source.slice(snapshotStart,commitStart);
  const mixPos=body.indexOf('ColorBookMixingBridge.completionSnapshot()');
  const classifyPos=Math.max(
    body.indexOf('ColorClassification.completed(rr,gg,bb,hex)'),
    body.indexOf('ColorClassification.completedWithRecipe(')
  );
  assert.ok(mixPos>=0 && classifyPos>mixPos,'classification must use the fresh completion snapshot');
  assert.match(body,/waterLevel:mixed\.waterLevel/);
  assert.match(body,/currentRecipe:ColorBookMixingBridge\.recipeSnapshot\(\)/);
});
