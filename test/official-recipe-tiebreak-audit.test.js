import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mixingEngine} from './production-mixing-utils.js';

test('legacy v10.8.47 tie-break report is retained only as historical evidence',()=>{
  const r=JSON.parse(fs.readFileSync('OFFICIAL-RECIPE-TIEBREAK-AUDIT.json','utf8'));
  assert.equal(r.bestSafe.maxRecipe,0.08);
  assert.equal(mixingEngine.id,'ryb-pigment-strength-dulling-touchtest-v1');
});
