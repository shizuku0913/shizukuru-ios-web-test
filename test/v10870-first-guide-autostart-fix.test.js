import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');

test('v10.8.70 first guide waits for actual atelier layout instead of fixed 900ms',()=>{
 const a=source.indexOf('const FirstPlayGuide=(()=>{');
 const b=source.indexOf('window.ShizukuruFirstPlayGuide',a);
 const block=source.slice(a,b);
 assert.match(block,/const tryStart=\(\)=>/);
 assert.match(block,/bottleRect\.width>4/);
 assert.match(block,/dishRect\.width>20/);
 assert.match(block,/setTimeout\(tryStart,250\)/);
 assert.doesNotMatch(block,/if\(!seen\)setTimeout\(start,900\)/);
});
test('v10.8.70 autostart still respects seen state and never opens over drawing mode',()=>{
 assert.match(source,/if\(seen\)return/);
 assert.match(source,/alreadySeen\|\|step!=='idle'/);
 assert.match(source,/!drawingOpen&&start\(\)/);
});
test('v10.8.70 keeps overlay-only guide and existing interaction completion',()=>{
 assert.match(source,/id="firstPlayGuide"/);
 assert.match(source,/emitFromMaster\(\);FirstPlayGuide\.pinchDone\(\)/);
 assert.match(source,/FirstPlayGuide\.mixPoint\(e\.clientX,e\.clientY\)/);
});
