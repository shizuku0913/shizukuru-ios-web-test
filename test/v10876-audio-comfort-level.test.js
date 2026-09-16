import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../app/src/main/assets/www/index.html',import.meta.url),'utf8');
test('audio uses a quieter final program level with stronger peak protection',()=>{
  assert.match(source,/safety\.gain\.value=\.36/);
  assert.match(source,/limiter\.threshold\.value=-14/);
  assert.match(source,/limiter\.ratio\.value=16/);
  assert.match(source,/volume=1/);
});
