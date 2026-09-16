import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../app/src/main/assets/www/index.html',import.meta.url),'utf8');
test('RC2 code5 adds loud-speaker headroom',()=>{
  assert.match(source,/highpass=ctx\.createBiquadFilter\(\)/);
  assert.match(source,/highpass\.frequency\.value=120/);
  assert.match(source,/limiter\.threshold\.value=-14/);
  assert.match(source,/limiter\.ratio\.value=16/);
  assert.match(source,/limiter\.attack\.value=\.001/);
  assert.match(source,/safety\.gain\.value=\.36/);
  assert.match(source,/master\.connect\(highpass\)\.connect\(limiter\)\.connect\(safety\)\.connect\(ctx\.destination\)/);
});
