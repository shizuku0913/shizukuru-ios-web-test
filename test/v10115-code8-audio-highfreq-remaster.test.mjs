import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');

test('code8 targeted high-frequency remaster marker exists',()=>{
  assert.match(source,/code8: targeted high-frequency remaster/);
});

test('code6 output protection remains present after source remaster',()=>{
  assert.match(source,/0\.36/);
});
