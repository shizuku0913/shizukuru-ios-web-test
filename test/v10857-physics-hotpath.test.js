import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {officialNames,mixOfficialRecipe,classification,mixingEngine} from './production-mixing-utils.js';
const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');

test('v10.8.57 transport hoists segment constants and gates sqrt by radius squared',()=>{
 const a=source.indexOf('const PaintTransportLifecycle=Object.freeze({');
 const b=source.indexOf('const PaintViscosityLifecycle=Object.freeze({',a);
 const block=source.slice(a,b);
 assert.match(block,/const radiusSq=radius\*radius/);
 assert.match(block,/const backBase=lerp\(/);
 assert.match(block,/const sideBase=lerp\(/);
 assert.match(block,/const carriedFactor=lerp\(/);
 assert.match(block,/if\(d2>=radiusSq\)continue/);
 assert.match(block,/const d=Math\.sqrt\(d2\)/);
});

test('v10.8.57 viscosity computes constant smooth and bridge factors once per segment',()=>{
 const a=source.indexOf('const PaintViscosityLifecycle=Object.freeze({');
 const b=source.indexOf('const PaintVortexLifecycle=Object.freeze({',a);
 const block=source.slice(a,b);
 assert.equal((block.match(/const smooth=/g)||[]).length,1);
 assert.equal((block.match(/const bridgeFactor=/g)||[]).length,1);
 assert.match(block,/const avg=\(mass\[i-1\]\+mass\[i\+1\]\+mass\[i-GRID\]\+mass\[i\+GRID\]\)\*\.25/);
});

test('v10.8.57 physics hot-path cleanup preserves 350 official color baselines',()=>{
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
