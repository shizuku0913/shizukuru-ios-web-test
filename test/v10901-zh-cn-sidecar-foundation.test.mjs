import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function load(path,name){
 const s=fs.readFileSync(path,'utf8').replace(new RegExp(`export const ${name}\\s*=`),`globalThis.__d=`);
 const c={}; vm.createContext(c); vm.runInContext(s,c); return c.__d;
}
const ja=load('app/src/main/assets/www/i18n/ja.js','ja');
const zh=load('app/src/main/assets/www/i18n/zh-CN.js','zhCN');
const html=fs.readFileSync('app/src/main/assets/www/index.html','utf8');
const bootstrap=fs.readFileSync('app/src/main/assets/www/i18n/bootstrap.js','utf8');

test('zh-CN draft sidecar mirrors all source keys',()=>{
 assert.ok(Object.keys(zh).length>=382);
 assert.deepEqual(Object.keys(zh).sort(),Object.keys(ja).sort());
});
test('zh-CN sidecar can be connected by later versions without changing its key structure',()=>{
 assert.equal(Object.keys(zh).length,Object.keys(ja).length);
});
test('draft module declares its non-runtime status',()=>{
 const source=fs.readFileSync('app/src/main/assets/www/i18n/zh-CN.js','utf8');
 assert.match(source,/not connected to runtime UI yet/i);
});
