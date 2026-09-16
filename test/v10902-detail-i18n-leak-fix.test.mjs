import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('app/src/main/assets/www/index.html','utf8');
function load(path,name){const s=fs.readFileSync(path,'utf8').replace(new RegExp(`export const ${name}\\s*=`),`globalThis.__d=`);const c={};vm.createContext(c);vm.runInContext(s,c);return c.__d}
const ja=load('app/src/main/assets/www/i18n/ja.js','ja'), en=load('app/src/main/assets/www/i18n/en.js','en'), zh=load('app/src/main/assets/www/i18n/zh-CN.js','zhCN');
test('detail kind and explanatory copy are runtime-localized',()=>{
 assert.match(html,/appText\('detail\.kind\.official'/);
 assert.match(html,/appText\('detail\.copy\.official'/);
 assert.equal(en['detail.kind.official'],'📖 Official Color');
 assert.equal(en['detail.copy.official'],'See how you made this color, then use it again as paint.');
});
test('all sidecar dictionaries remain structurally aligned',()=>{
 assert.equal(Object.keys(ja).length,Object.keys(en).length);
 assert.equal(Object.keys(ja).length,Object.keys(zh).length);
 assert.deepEqual(Object.keys(ja).sort(),Object.keys(en).sort());
 assert.deepEqual(Object.keys(ja).sort(),Object.keys(zh).sort());
});
