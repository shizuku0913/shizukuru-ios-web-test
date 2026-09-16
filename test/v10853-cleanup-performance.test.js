import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mixingEngine,officialNames,mixOfficialRecipe,classification} from './production-mixing-utils.js';
const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');

test('v10.8.54 production HTML contains no runtime validation matrix',()=>{
 assert.match(source,/const startupMode=MixingEngineMode\.RYB_PIGMENT/);
 assert.doesNotMatch(source,/const RYBEngineValidationSuite=Object\.freeze\(/);
 assert.doesNotMatch(source,/window\.ShizukuMixingEngine=Object\.freeze\(/);
});
test('v10.8.53 caches fixed-source color calculations',()=>{
 assert.match(source,/sourceRybCache:new Map\(\)/);
 assert.match(source,/hueCache:new Map\(\)/);
 assert.match(source,/PaintRYBColorSpace\.sourceRyb\(hex\)/);
});
test('v10.8.53 preserves 350 of 350 official baseline discoveries',()=>{
 let correct=0;
 for(const name of officialNames){
   const c=mixOfficialRecipe(name,1);
   const strict=classification.nearestStrictOfficialRGB(...c);
   const final=strict.entry?strict:classification.conditionalOfficialRescueRGB(...c);
   if(final.entry?.name===name)correct++;
 }
 assert.equal(correct,350);
 assert.equal(mixingEngine.id,'ryb-pigment-strength-dulling-touchtest-v1');
});
