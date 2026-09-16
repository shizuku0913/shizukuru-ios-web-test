import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');

test('RC2 code6 uses deeper phone-speaker headroom',()=>{
  assert.match(source,/highpass\.frequency\.value=120/);
  assert.match(source,/limiter\.threshold\.value=-14/);
  assert.match(source,/limiter\.ratio\.value=16/);
  assert.match(source,/limiter\.attack\.value=\.001/);
  assert.match(source,/safety\.gain\.value=\.36/);
});

test('RC2 code6 lowers hot embedded-source staging',()=>{
  assert.match(source,/paintDrop:\.70,waterAdd:\.72/);
  assert.match(source,/mix3:\.58,mix4:\.60/);
  assert.match(source,/morphDiscovery:\.68/);
});

test('RC2 code6 prevents sub-42ms duplicate paint transients',()=>{
  assert.match(source,/PAINT_DROP_MIN_INTERVAL_MS=42/);
  assert.match(source,/now-lastPaintDropAt<PAINT_DROP_MIN_INTERVAL_MS/);
});
