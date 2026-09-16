const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const index=fs.readFileSync(path.join(__dirname,'..','app','src','main','assets','www','index.html'),'utf8');

test('parent copy explicitly states that support never changes features',()=>{
  assert.match(index,/応援の有無によって、利用できる機能に違いはありません。/);
  assert.match(index,/Supporting the app does not unlock or change any features\./);
});

test('parent gate sits before the parent area and blocks drawing',()=>{
  assert.match(index,/id="parentGateOverlay"/);
  assert.match(index,/id="drawParentArea"/);
  assert.match(index,/addEventListener\('click',openParentGate\)/);
  const block=index.slice(index.indexOf('function drawingBlockingUiOpen'),index.indexOf('function syncNativeDrawingUiGate'));
  assert.match(block,/parentGateOverlay/);
});

test('support state changes only when a real purchase bridge reports purchased',()=>{
  assert.match(index,/ShizukuruSupportPurchase\?\.isPurchased/);
  assert.match(index,/'parent\.supported':'✓ 応援ありがとうございます'/);
  assert.match(index,/'parent\.supported':'✓ Thank you for your support'/);
  const fn=index.slice(index.indexOf('function refreshParentSupportState'),index.indexOf("document.addEventListener('shizukuru-support-purchase-changed'"));
  assert.doesNotMatch(fn,/localStorage\.setItem|paid=true|purchaseComplete/);
});
