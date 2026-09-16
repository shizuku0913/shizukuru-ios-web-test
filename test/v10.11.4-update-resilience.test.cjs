const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/www/index.html'),'utf8');

test('v10.11.4 startup persists normalized official discoveries',()=>{
  assert.match(html,/commit the normalized current-format list/);
  assert.match(html,/JSON\.stringify\(parsed\)!==normalizedFingerprint[\s\S]{0,180}PersistenceLifecycle\.writeJSON\(DISCOVERY_STORAGE_KEY,discoveredColors\)/);
});
test('v10.11.4 startup persists migrated near misses',()=>{
  assert.match(html,/persist migrated near-miss keys too/);
  assert.match(html,/PersistenceLifecycle\.writeJSON\(NEAR_MISS_STORAGE_KEY,nearMisses\)/);
});
test('v10.11.4 retains stable update keys and 300-500 gift range',()=>{
  for(const key of ['yubisaki_discoveries','shizuku_near_misses_v1','shizuku_my_discoveries_v1','shizukuru.gift.progress.v1','shizukuru.gift.reservation.v1','shizuku-language'])
    assert.ok(html.includes(key),key);
  assert.match(html,/giftRangeMin:300/);
  assert.match(html,/giftRangeMax:500/);
  assert.match(html,/OFFICIAL_V10110_NAME_MIGRATION=Object\.freeze/);
});
