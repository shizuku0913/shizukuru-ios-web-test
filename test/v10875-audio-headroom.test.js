import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../app/src/main/assets/www/index.html',import.meta.url),'utf8');
test('audio path keeps or improves speaker headroom',()=>{
  assert.match(source,/highpass\.frequency\.value=120/);
  assert.match(source,/limiter\.threshold\.value=-14/);
  assert.match(source,/limiter\.knee\.value=6/);
  assert.match(source,/limiter\.ratio\.value=16/);
  assert.match(source,/safety\.gain\.value=\.36/);
  assert.match(source,/paintDrop:\.70,waterAdd:\.72/);
});
