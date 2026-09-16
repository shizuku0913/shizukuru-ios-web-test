import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const production=fs.readFileSync('app/src/main/assets/www/index.html','utf8');
const reference=fs.readFileSync('test/reference-models-v10854.js','utf8');

test('v10.8.54 KM reference and bench are not shipped in production HTML',()=>{
  assert.doesNotMatch(production,/const KMPigmentReferenceModel=/);
  assert.doesNotMatch(production,/const MixingReferenceBench=/);
  assert.doesNotMatch(production,/kmReferenceProductionActive/);
});
test('v10.8.54 KM reference is retained test-side for offline comparison',()=>{
  assert.match(reference,/const KMPigmentReferenceModel=Object\.freeze\(/);
  assert.match(reference,/reflectanceToKS/);
  assert.match(reference,/ksToReflectance/);
  assert.match(reference,/const MixingReferenceBench=Object\.freeze\(/);
  assert.match(reference,/blueYellow/);
  assert.match(reference,/redYellow/);
  assert.match(reference,/redBlue/);
});
