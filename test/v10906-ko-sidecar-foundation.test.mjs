import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs'; import vm from 'node:vm';

function load(path,name){
 const s=fs.readFileSync(path,'utf8').replace(new RegExp(`export const ${name}\\s*=`),'globalThis.__d=');
 const c={}; vm.createContext(c); vm.runInContext(s,c); return c.__d;
}
const en=load('app/src/main/assets/www/i18n/en.js','en');
const ko=load('app/src/main/assets/www/i18n/ko.js','ko');
const names=load('app/src/main/assets/www/i18n/official-names-ko.js','officialNamesKo');
const boot=fs.readFileSync('app/src/main/assets/www/i18n/bootstrap.js','utf8');
const html=fs.readFileSync('app/src/main/assets/www/index.html','utf8');

test('Korean UI sidecar mirrors all 387 runtime keys',()=>{
 assert.equal(Object.keys(ko).length,387);
 assert.deepEqual(Object.keys(ko).sort(),Object.keys(en).sort());
});
test('Korean official-name sidecar covers all 350 official colors',()=>{
 assert.equal(Object.keys(names).length,350);
});
test('Korean sidecar remains structurally complete when connected by later versions',()=>{
 assert.equal(Object.keys(ko).length,387);
 assert.equal(Object.keys(names).length,350);
});
test('foundation files explicitly declare non-runtime status',()=>{
 assert.match(fs.readFileSync('app/src/main/assets/www/i18n/ko.js','utf8'),/NOT connected to runtime UI/i);
 assert.match(fs.readFileSync('app/src/main/assets/www/i18n/official-names-ko.js','utf8'),/NOT connected to runtime UI/i);
});
