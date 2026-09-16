const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const index=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/www/index.html'),'utf8');

test('gift range is 300-500',()=>{
  assert.match(index,/giftRangeMin:300/);
  assert.match(index,/giftRangeMax:500/);
});

test('gift range migration preserves existing progress instead of recreating state',()=>{
  const start=index.indexOf("const load=()=>");
  const end=index.indexOf("let state=load()",start);
  assert.ok(start>=0&&end>start);
  const load=index.slice(start,end);
  assert.match(load,/const migrated=\{/);
  assert.match(load,/\.\.\.loaded/);
  assert.match(load,/clampInteger\(loaded\.b,configuredRange\.min,configuredRange\.max\)/);
  assert.doesNotMatch(load,/if\(!settingsChanged\)return loaded;\s*return createInitialState\(configuredRange,DEFAULT_TEST_MODE\)/);
});
