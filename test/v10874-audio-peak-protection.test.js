import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app/src/main/assets/www/index.html',import.meta.url),'utf8');
test('final audio bus protects against clipping at high volume',()=>{
  assert.match(source,/let ctx=null,master=null,highpass=null,limiter=null,safety=null,enabled=true,volume=1/);
  assert.match(source,/limiter=ctx\.createDynamicsCompressor\(\)/);
  assert.match(source,/limiter\.threshold\.value=-14/);
  assert.match(source,/limiter\.ratio\.value=16/);
  assert.match(source,/safety\.gain\.value=\.36/);
  assert.match(source,/master\.connect\(highpass\)\.connect\(limiter\)\.connect\(safety\)\.connect\(ctx\.destination\)/);
  assert.match(source,/function setMasterVolume\(v\)\{volume=clamp\(v,0,1\)/);
  assert.doesNotMatch(source,/clamp\(v,0,1\.5\)/);
});
