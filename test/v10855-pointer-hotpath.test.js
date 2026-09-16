import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {officialNames,mixOfficialRecipe,classification,mixingEngine} from './production-mixing-utils.js';
const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');

test('v10.8.55 pointer path uses allocation-free variance fast path',()=>{
  assert.match(source,/gain\(now=performance\.now\(\)\)\{\s*if\(!this\.shouldMeasure\(now\)\)return 0;/);
  assert.match(source,/function maybeMeasureVariance\(\)\{\s*return MixingVarianceMonitor\.gain\(\);/);
});

test('v10.8.55 skips target-color remix when mix progress is unchanged',()=>{
  const a=source.indexOf('const MixingProgressLifecycle=Object.freeze({');
  const b=source.indexOf('function prepareCenterHemisphere',a);
  const block=source.slice(a,b);
  assert.match(block,/const previousProgress=mixProgress/);
  assert.match(block,/if\(mixProgress!==previousProgress\)SourcePaintModel\.syncTarget\(\)/);
  assert.match(block,/CompletionTrigger\.tryStart\(\)/);
});

test('v10.8.55 hot-path cleanup preserves production mixer and 350 official baseline discoveries',()=>{
  assert.equal(mixingEngine.id,'ryb-pigment-strength-dulling-touchtest-v1');
  let correct=0;
  for(const name of officialNames){
    const c=mixOfficialRecipe(name,1);
    const strict=classification.nearestStrictOfficialRGB(...c);
    const final=strict.entry?strict:classification.conditionalOfficialRescueRGB(...c);
    if(final.entry?.name===name)correct++;
  }
  assert.equal(correct,350);
});
