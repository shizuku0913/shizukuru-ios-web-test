const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const index=fs.readFileSync(path.join(__dirname,'..','app','src','main','assets','www','index.html'),'utf8');

test('memory letter lives under the parent area, not directly in drawing settings',()=>{
  const settings=index.slice(index.indexOf('id="drawSettingsMenu"'),index.indexOf('id="drawDevProbe"'));
  assert.match(settings,/id="drawParentArea"/);
  assert.doesNotMatch(settings,/id="drawMemoryLetter"/);
  const parent=index.slice(index.indexOf('id="parentAreaOverlay"'),index.indexOf('id="memoryLetterOverlay"'));
  assert.match(parent,/id="parentSupportButton"/);
  assert.match(parent,/id="drawMemoryLetter"/);
  assert.match(parent,/Shizukuruは、広告なしですべての機能を無料でお楽しみいただけます。/);
});

test('memory and parent overlays block native drawing',()=>{
  const start=index.indexOf('function drawingBlockingUiOpen');
  const end=index.indexOf('function syncNativeDrawingUiGate',start);
  const block=index.slice(start,end);
  assert.match(block,/memoryLetterOverlay/);
  assert.match(block,/parentAreaOverlay/);
});

test('web drawing pointerdown also refuses input while blocking UI is open',()=>{
  const p=index.indexOf("drawingCanvas.addEventListener('pointerdown'");
  assert.notEqual(p,-1);
  const slice=index.slice(p,p+500);
  assert.match(slice,/drawingBlockingUiOpen\(\)/);
});

test('support button never fakes a purchase without a billing bridge',()=>{
  const p=index.indexOf("document.getElementById('parentSupportButton')");
  const slice=index.slice(p,p+1200);
  assert.match(slice,/ShizukuruSupportPurchase/);
  assert.match(slice,/supportPreparing/);
  assert.doesNotMatch(slice,/localStorage\.setItem|purchaseComplete|paid=true/);
});
