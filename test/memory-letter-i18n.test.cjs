const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const index=fs.readFileSync(path.join(__dirname,'..','app','src','main','assets','www','index.html'),'utf8');

test('memory letter exists as a normal settings entry with JA/EN copy',()=>{
  assert.match(index,/id="drawMemoryLetter"/);
  assert.match(index,/id="memoryLetterOverlay"/);
  for(let i=1;i<=18;i++){
    const key=`memory.p${i}`;
    const hits=index.split(`'${key}'`).length-1;
    assert.equal(hits,2,`${key} must exist once in JA and once in EN dictionaries`);
  }
  assert.match(index,/'memory\.title':'色のあとに残るもの'/);
  assert.match(index,/'memory\.title':'What Colors Leave Behind'/);
  assert.match(index,/Perhaps colors remember,/);
});

test('memory letter is deliberately not purchase-gated',()=>{
  const markup=index.slice(index.indexOf('id="drawMemoryLetter"')-300,index.indexOf('id="drawMemoryLetter"')+400);
  assert.doesNotMatch(markup,/purchase|paid|unlock|購入|課金|応援済/);
  const openFn=index.slice(index.indexOf('function openMemoryLetter'),index.indexOf('function closeMemoryLetter'));
  assert.doesNotMatch(openFn,/purchase|paid|unlock|購入|課金|giftProgress|support/);
});

test('existing philosophy coda remains intact',()=>{
  assert.match(index,/data-i18n="philosophy\.unfound"/);
  assert.match(index,/data-i18n="philosophy\.firstColor"/);
  assert.match(index,/'philosophy\.unfound':'まだ、この世界には\\n見つかっていない色があります。'/);
  assert.match(index,/'philosophy\.firstColor':'あなたが描く、最初の一色。'/);
});
