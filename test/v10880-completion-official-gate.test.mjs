import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {mixingEngine,classification,reproductionRecipes} from './production-mixing-utils.js';

const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');

test('v10.8.80 recomputes targetColor at mixProgress=1 before freezing completion',()=>{
  assert.match(source,/commit\(now\)\{[\s\S]*?mixProgress=1;\s*SourcePaintModel\.syncTarget\(\);\s*completedWaterLevel=finalizeCompletedGrid\(\);/);
});

test('v10.8.80 final official gate reuses the full official classification path',()=>{
  assert.match(source,/const finalClassification=ColorClassification\.completedWithRecipe\(/);
  assert.match(source,/finalClassification\.kind==='official'/);
  assert.doesNotMatch(source,/const finalGate=AdaptiveOfficialDiscovery\.evaluate\(cr,cg,cb,entry\)/);
});

test('all 350 embedded secret recipes resolve as their intended official color at mixLevel=1',()=>{
  const m=source.match(/const OFFICIAL_SECRET_RECIPES_V10878=Object\.freeze\((\{[\s\S]*?\})\);\nfunction officialSecretRecipe/);
  assert.ok(m,'secret recipe map missing');
  const recipes=vm.runInNewContext('('+m[1]+')');
  const hex={};
  for(const record of Object.values(reproductionRecipes)){
    for(const row of record.recipe) if(!hex[row.name]) hex[row.name]=row.hex;
  }
  let count=0;
  for(const [name,recipe] of Object.entries(recipes)){
    const total=recipe.parts.reduce((sum,x)=>sum+x.parts,0);
    const rows=recipe.parts.map(x=>({name:x.name,hex:hex[x.name],ratio:x.parts/total}));
    const sources=new Map(rows.map(x=>[x.hex,x.ratio]));
    const rgb=Array.from(mixingEngine.mixAggregate({total:1,sources,waterLevel:recipe.water,mixLevel:1}),Math.round);
    const result=classification.completedWithRecipe(...rgb,'#000000',rows,recipe.water);
    assert.equal(result.kind,'official',`${name}: not official (${rgb.join(',')})`);
    assert.equal(result.official.entry?.name,name,`${name}: became ${result.official.entry?.name}`);
    count++;
  }
  assert.equal(count,350);
});

test('lavender gray recipe reaches the strict official gate at final mix level',()=>{
  const sources=new Map([['#ff0000',.25],['#0000ff',.50],['#ffffff',.25]]);
  const rgb=Array.from(mixingEngine.mixAggregate({total:1,sources,waterLevel:0,mixLevel:1}),Math.round);
  assert.equal(rgb.join(','),'115,62,196');
  assert.equal(classification.nearestStrictOfficialRGB(...rgb).entry?.name,'ラベンダーグレー');
});
