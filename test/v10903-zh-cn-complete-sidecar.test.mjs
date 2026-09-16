import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';
function load(path,name){const s=fs.readFileSync(path,'utf8').replace(new RegExp(`export const ${name}\\s*=`),`globalThis.__d=`);const c={};vm.createContext(c);vm.runInContext(s,c);return c.__d}
const en=load('app/src/main/assets/www/i18n/en.js','en'),zh=load('app/src/main/assets/www/i18n/zh-CN.js','zhCN');
const boot=fs.readFileSync('app/src/main/assets/www/i18n/bootstrap.js','utf8');
const ph=s=>[...s.matchAll(/\{[^}]+\}/g)].map(x=>x[0]).sort();
test('Simplified Chinese dictionary has all 387 keys',()=>{assert.equal(Object.keys(zh).length,387);assert.deepEqual(Object.keys(zh).sort(),Object.keys(en).sort())});
test('all placeholders match English source',()=>{for(const k of Object.keys(en))assert.deepEqual(ph(zh[k]),ph(en[k]),k)});
test('no Japanese kana remains in Simplified Chinese values',()=>{for(const [k,v] of Object.entries(zh))assert.doesNotMatch(v,/[\u3040-\u30ff]/,k)});
test('Chinese dictionary remains complete when connected in later versions',()=>{assert.ok(Object.keys(zh).length===387)});
