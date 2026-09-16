import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');

test('v10.8.69 guide is overlay-only: no dimmer, spotlight, or atelier reset',()=>{
 assert.match(source,/id="firstPlayGuide"/);
 assert.doesNotMatch(source,/play-guide-dim|play-guide-spot/);
 const a=source.indexOf('const FirstPlayGuide=(()=>{');
 const b=source.indexOf("pinchZone.addEventListener('pointerdown'",a);
 const block=source.slice(a,b);
 const start=block.slice(block.indexOf('function start()'),block.indexOf('function finish'));
 assert.doesNotMatch(start,/closeDrawingMode\s*\(|clearCanvas\s*\(|reset\s*\(|innerHTML\s*=|style\.display\s*=/);
 assert.match(start,/visual-only/);
});

test('v10.8.69 hides legacy textual and split-finger cues only while guide is active',()=>{
 assert.match(source,/body\.first-play-guide-active #pinchRangeIndexCue/);
 assert.match(source,/body\.first-play-guide-active #pinchRangeThumbCue/);
 assert.match(source,/body\.first-play-guide-active #status\{visibility:hidden!important\}/);
});

test('v10.8.69 advances from real pinch to real dish mixing and persists completion',()=>{
 assert.match(source,/emitFromMaster\(\);FirstPlayGuide\.pinchDone\(\)/);
 assert.match(source,/FirstPlayGuide\.mixPoint\(e\.clientX,e\.clientY\)/);
 assert.match(source,/shizukuru\.firstPlayGuide\.v2\.seen/);
});

test('v10.8.72 guide is intentionally first-run only',()=>{
 assert.doesNotMatch(source,/id="drawPlayGuide"/);
 assert.match(source,/shizukuru\.firstPlayGuide\.v2\.seen/);
});
