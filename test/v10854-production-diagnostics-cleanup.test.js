import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {officialNames,mixOfficialRecipe,classification,mixingEngine} from './production-mixing-utils.js';
const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');

test('v10.8.54 removes development-only globals from production HTML',()=>{
 assert.doesNotMatch(source,/window\.ShizukuruOfficialDiscoveryDiagnostics=/);
 assert.doesNotMatch(source,/window\.ShizukuMixingEngine=/);
 assert.doesNotMatch(source,/const KMPigmentReferenceModel=/);
 assert.doesNotMatch(source,/const MixingReferenceBench=/);
 assert.doesNotMatch(source,/const RYBEngineValidationSuite=/);
});
test('v10.8.54 production cleanup preserves the fixed mixer and 350 official discoveries',()=>{
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
