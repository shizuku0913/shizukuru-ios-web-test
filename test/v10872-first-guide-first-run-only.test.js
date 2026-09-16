import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');
test('v10.8.72 removes settings replay entry and handler',()=>{
 assert.doesNotMatch(source,/id="drawPlayGuide"/);
 assert.doesNotMatch(source,/getElementById\('drawPlayGuide'\)/);
});
test('v10.8.72 preserves first-run guide and fixed autostart',()=>{
 assert.match(source,/id="firstPlayGuide"/);
 assert.match(source,/shizukuru\.firstPlayGuide\.v2\.seen/);
 assert.match(source,/window\.ShizukuruFirstPlayGuide=FirstPlayGuide/);
 assert.match(source,/window\.ShizukuruFirstPlayGuide\?\.auto\(\)/);
 assert.match(source,/emitFromMaster\(\);FirstPlayGuide\.pinchDone\(\)/);
});
