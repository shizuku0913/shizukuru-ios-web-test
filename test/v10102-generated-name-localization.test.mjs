import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync('app/src/main/assets/www/index.html','utf8');
const registry=fs.readFileSync('app/src/main/assets/www/i18n/language-registry.js','utf8');
const ar=fs.readFileSync('app/src/main/assets/www/i18n/packs/ar.js','utf8');
const hi=fs.readFileSync('app/src/main/assets/www/i18n/packs/hi.js','utf8');
test('registry publishes optional generated-name dictionaries',()=>assert.match(registry,/ShizukuruOptionalGeneratedNames/));
test('Arabic covers leak names seen on device',()=>{
  for(const s of ['かわいいうさぎの夢','かわいい虹色うさぎの夢','ピンクしずくとうさぎ','ラムネの湖','空の小窓','星空ゼリー']) assert.match(ar,new RegExp(s));
});
test('Hindi covers the same legacy/generated names',()=>{
  for(const s of ['かわいいうさぎの夢','かわいい虹色うさぎの夢','ピンクしずくとうさぎ','ラムネの湖','空の小窓','星空ゼリー']) assert.match(hi,new RegExp(s));
});
test('resolver checks selected-locale generated names before English fallback',()=>{
  assert.match(html,/ShizukuruOptionalGeneratedNames\?\.\[language\]\?\.\[raw\]/);
});
