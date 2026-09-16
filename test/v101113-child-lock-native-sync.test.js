import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../app/src/main/assets/www/index.html', import.meta.url),'utf8');
const java=fs.readFileSync(new URL('../app/src/main/java/jp/shizukuru/mixinglab/MainActivity.java', import.meta.url),'utf8');

test('Android lock request does not mark Web UI locked before native confirmation',()=>{
  assert.match(html,/if\(target&&setNativeNavigationLock\(true\)\)\{[\s\S]*?return;[\s\S]*?drawLocked=target/);
});

test('native confirmation is detected by polling actual Lock Task state',()=>{
  assert.match(java,/if \(isActuallyInLockTaskMode\(\)\) \{[\s\S]*?navigationLocked = true;[\s\S]*?notifyWebNavigationLockState\(true\)/);
  assert.match(java,/elapsed < 30000L/);
});
