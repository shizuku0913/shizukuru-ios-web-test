import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../app/src/main/assets/www/index.html', import.meta.url),'utf8');
const java=fs.readFileSync(new URL('../app/src/main/java/jp/shizukuru/mixinglab/MainActivity.java', import.meta.url),'utf8');

test('child lock explains purpose without adding a second confirmation dialog',()=>{
  assert.match(html,/お子さま用ロック/);
  assert.match(html,/誤ってShizukuruから離れにくくします。/);
});

test('native navigation lock is committed only after Android actually enters Lock Task mode',()=>{
  assert.match(java,/pendingNavigationLock = true;\s*pendingNavigationLockStartedAt = android\.os\.SystemClock\.elapsedRealtime\(\);\s*navigationLocked = false;\s*try \{\s*startLockTask\(\)/s);
  assert.match(java,/if \(isActuallyInLockTaskMode\(\)\) \{\s*pendingNavigationLock = false;\s*pendingNavigationLockStartedAt = 0L;\s*navigationLocked = true;/s);
});

test('Android cancellation rolls the web lock state back instead of trapping Back navigation',()=>{
  assert.match(java,/navigationLocked = false;\s*applyUnlockedSystemUi\(\);\s*notifyWebNavigationLockState\(false\)/s);
  assert.match(html,/syncNativeState:\(locked\)=>/);
});
