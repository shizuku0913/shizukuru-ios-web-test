const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const index=fs.readFileSync(path.join(__dirname,'..','app','src','main','assets','www','index.html'),'utf8');

test('remaining user-facing dynamic areas use i18n keys',()=>{
  for(const key of [
    'research.near.level1Title','research.near.level3Copy','research.adjust.add',
    'detail.forgotStatus','palette.switch','atelier.bottleFilled','draw.emptyPalette',
    'save.preparing','share.opening','lock.unlockAria'
  ]){
    assert.ok(index.includes(`'${key}'`),key);
  }
  assert.doesNotMatch(index,/status\.textContent='画像を保存しました'/);
  assert.doesNotMatch(index,/status\.textContent='共有画面を開いています…'/);
  assert.doesNotMatch(index,/drawLockButton\.textContent='🔓 そのまま長押し…'/);
  assert.doesNotMatch(index,/document\.getElementById\('nearHintLevel'\)\.textContent=`ヒント/);
});

test('translation completion keeps core logic untouched by presentation pass',()=>{
  assert.match(index,/giftRangeMin:300/);
  assert.match(index,/giftRangeMax:500/);
  assert.match(index,/const OFFICIAL_ENCYCLOPEDIA_NAMES=Object\.freeze/);
  assert.match(index,/function nearAdjustmentTips\(currentHex,targetHex\)/);
  assert.match(index,/const gain=before-dist\(mixed\)/);
});
