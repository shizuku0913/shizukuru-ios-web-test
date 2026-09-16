import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');

test('v10.8.71 autostart calls the guide through its exported window API',()=>{
 assert.match(source,/window\.ShizukuruFirstPlayGuide=FirstPlayGuide/);
 assert.match(source,/window\.ShizukuruFirstPlayGuide\?\.auto\(\)/);
 assert.doesNotMatch(source,/\nFirstPlayGuide\.auto\(\);\n/);
});

test('v10.8.71 guide definition remains inside main IIFE while final startup script is outside',()=>{
 const definition=source.indexOf('const FirstPlayGuide=(()=>{');
 const mainClose=source.indexOf('</script>',definition);
 const auto=source.indexOf('window.ShizukuruFirstPlayGuide?.auto()',mainClose);
 assert.ok(definition>=0&&mainClose>definition&&auto>mainClose);
});

test('v10.8.71 preserves retry-based first-launch readiness logic',()=>{
 assert.match(source,/setTimeout\(tryStart,250\)/);
 assert.match(source,/bottleRect\.width>4/);
 assert.match(source,/dishRect\.width>20/);
});
