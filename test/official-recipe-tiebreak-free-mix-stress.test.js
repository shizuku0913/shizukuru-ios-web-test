import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mixingEngine} from './production-mixing-utils.js';

test('legacy v10.8.48 free-mix stress report is retained but not treated as a current-engine guarantee',()=>{
  const r=JSON.parse(fs.readFileSync('OFFICIAL-RECIPE-TIEBREAK-FREE-MIX-STRESS.json','utf8'));
  assert.equal(r.buckets.allRandom.n,50000);
  assert.equal(mixingEngine.id,'ryb-pigment-strength-dulling-touchtest-v1');
});
