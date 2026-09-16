import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');
function load(path,name){
 const s=fs.readFileSync(path,'utf8').replace(new RegExp(`export const ${name}\\s*=`),`globalThis.__d=`);
 const c={}; vm.createContext(c); vm.runInContext(s,c); return c.__d;
}
const ja=load('app/src/main/assets/www/i18n/ja.js','ja');
const en=load('app/src/main/assets/www/i18n/en.js','en');

test('JA and EN dictionaries remain exactly key-aligned',()=>{
 assert.equal(Object.keys(ja).length,Object.keys(en).length);
 assert.deepEqual(Object.keys(ja).sort(),Object.keys(en).sort());
});
test('drawing eraser label is localized',()=>{
 assert.equal(en['draw.eraser'],'Eraser');
 assert.match(source,/appText\('draw\.eraser'/);
 assert.doesNotMatch(source,/eraser\.setAttribute\('aria-label','消しゴム'\)/);
});
test('dynamic paint-tube accessibility text is localized',()=>{
 assert.ok(en['atelier.paintTubeAria'].includes('{name}'));
 assert.match(source,/appText\('atelier\.paintTubeAria'/);
});
test('JA/EN switch remains delegated through isolated i18n provider',()=>{
 assert.match(source,/external\.has\(key,language\)/);
 assert.match(source,/external\.t\(key,params\|\|\{\},language\)/);
});
