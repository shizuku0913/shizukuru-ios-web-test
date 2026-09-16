import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const java=fs.readFileSync('app/src/main/java/jp/shizukuru/mixinglab/MainActivity.java','utf8');
const html=fs.readFileSync('app/src/main/assets/www/index.html','utf8');

test('v10.8.61 native drawing has its own app-file recovery independent of WebView',()=>{
 assert.match(java,/NATIVE_DRAWING_RECOVERY_FILE = "drawing-recovery-v1\.png"/);
 assert.match(java,/startupRecoveryBitmap = BitmapFactory\.decodeFile/);
 assert.match(java,/void persistRecoveryNow\(\)/);
 assert.match(java,/private void persistRecoveryAsync\(\)/);
 assert.match(java,/writeRecoverySnapshot\(Bitmap snapshot, int generation\)/);
});

test('v10.8.61 every committed native stroke schedules native persistence',()=>{
 const actionUp=java.slice(java.indexOf('MotionEvent.ACTION_UP'),java.indexOf('private void notifyWebCommitted'));
 assert.match(actionUp,/persistRecoveryAsync\(\)/);
 assert.match(actionUp,/recoveryAuthoritative = true/);
});

test('v10.8.61 Android onPause synchronously persists before Activity can terminate',()=>{
 const a=java.indexOf('protected void onPause()');
 const b=java.indexOf('protected void onResume()',a);
 const block=java.slice(a,b);
 assert.match(block,/nativeDrawingView\.persistRecoveryNow\(\)/);
 assert.ok(block.indexOf('persistRecoveryNow()')<block.indexOf('super.onPause()'));
});

test('v10.8.61 Web open prefers native app-file recovery over IndexedDB',()=>{
 const a=html.indexOf('async function openDrawingMode(){');
 const b=html.indexOf('async function closeDrawingMode(){',a);
 const block=html.slice(a,b);
 assert.match(block,/hasNativeRecoveryState\?\.\(\)/);
 assert.match(block,/if\(latest&&!nativeHasRecovery\)/);
 assert.match(block,/if\(!nativeHasRecovery&&latest\?\.nativeDataUrl\)/);
});
