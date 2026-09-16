import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {officialNames,mixOfficialRecipe,classification,mixingEngine} from './production-mixing-utils.js';
const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');

test('v10.8.56 gates radial sqrt work by squared-distance radius',()=>{
  assert.match(source,/const presenceOuterSq=presenceOuter\*presenceOuter/);
  assert.match(source,/if\(pd2<presenceOuterSq\)/);
  assert.match(source,/if\(td2<pointerOuterSq\)touchGloss=smoothstep\(24,2,Math\.sqrt\(td2\)\)/);
});

test('v10.8.56 uploads only current union previous paint bounds',()=>{
  assert.match(source,/const uploadMinX=Math\.min\(currentMinX,__previousUploadMinX\)/);
  assert.match(source,/ictx\.putImageData\(\s*pixels,0,0,\s*uploadMinX,uploadMinY,/);
  assert.match(source,/__previousUploadMinX=currentMinX/);
});

test('v10.8.56 dirty upload path clears stale bounds on completion',()=>{
  assert.match(source,/completion renderer no longer uses the grid image/);
  assert.match(source,/__previousUploadMinX=__previousUploadMinY=GRID/);
  assert.match(source,/__previousUploadMaxX=__previousUploadMaxY=-1/);
});

test('v10.8.56 render optimization preserves fixed production color behavior',()=>{
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
