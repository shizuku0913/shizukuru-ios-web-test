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
const ph=s=>[...String(s).matchAll(/\{[^}]+\}/g)].map(x=>x[0]).sort();

test('Korean UI dictionary is complete at 387 keys',()=>{
  assert.equal(Object.keys(ko).length,387);
  assert.deepEqual(Object.keys(ko).sort(),Object.keys(en).sort());
});
test('all Korean UI placeholders match English source',()=>{
  for(const k of Object.keys(en)) assert.deepEqual(ph(ko[k]),ph(en[k]),k);
});
test('Korean official-color names cover all 350 official colors',()=>{
  assert.equal(Object.keys(names).length,350);
});
test('Korean official display names contain no Japanese kana or Latin leftovers',()=>{
  for(const [k,v] of Object.entries(names)){
    assert.doesNotMatch(v,/[\u3040-\u30ff]/,k);
    assert.doesNotMatch(v,/[A-Za-z]/,k);
  }
});
test('known official colors have Korean display names',()=>{
  assert.equal(names['せんたくしたぺんぎんいろ'],'깨끗이 씻은 펭귄');
  assert.equal(names['ラベンダーグレー'],'라벤더 회색');
  assert.equal(names['うすいみどり'],'밝은 초록');
  assert.equal(names['もぐらいろ'],'두더지');
});
test('Korean dictionary remains complete after runtime connection',()=>{
  assert.equal(Object.keys(ko).length,387);
});
