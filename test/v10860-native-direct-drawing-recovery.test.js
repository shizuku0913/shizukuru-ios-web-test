import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');

test('v10.8.60 recovery persists authoritative Android native PNG directly',()=>{
 const a=source.indexOf("async function saveDrawingRecovery(reason='settled'){");
 const b=source.indexOf('function scheduleDrawingRecovery',a);
 const block=source.slice(a,b);
 assert.match(block,/getNativePngDataUrl\(\)/);
 assert.match(block,/nativeDataUrl:nativeDataUrl\|\|null/);
 assert.match(block,/source:nativeDataUrl\?'native-data-url':'web-blob'/);
});

test('v10.8.60 recovery loader accepts native PNG or Web Blob',()=>{
 const a=source.indexOf('async function loadDrawingRecovery(){');
 const b=source.indexOf('async function applyDrawingRecovery',a);
 const block=source.slice(a,b);
 assert.match(block,/record\.nativeDataUrl/);
 assert.match(block,/record\.image instanceof Blob/);
 assert.match(block,/if\(!nativeValid&&!blobValid\)return null/);
});

test('v10.8.60 Drawing open restores native PNG directly and never blanks Native without a recovery record',()=>{
 const a=source.indexOf('async function openDrawingMode(){');
 const b=source.indexOf('async function closeDrawingMode(){',a);
 const block=source.slice(a,b);
 assert.match(block,/hasNativeRecoveryState\?\.\(\)/);
 assert.match(block,/if\(!nativeHasRecovery&&latest\?\.nativeDataUrl\)/);
 assert.match(block,/else if\(!nativeHasRecovery&&latest\)\{\s*syncWebBitmapToNative\(\)/);
 assert.doesNotMatch(block,/setTimeout\(syncWebBitmapToNative/);
});

test('v10.8.60 close saves before deactivating Native drawing surface',()=>{
 const a=source.indexOf('async function closeDrawingMode(){');
 const b=source.indexOf('function captureDrawTransform()',a);
 const block=source.slice(a,b);
 const save=block.indexOf("await saveDrawingRecovery('drawing-closed')");
 const deactivate=block.indexOf("setActive?.(false)");
 assert.ok(save>=0&&deactivate>save);
});
