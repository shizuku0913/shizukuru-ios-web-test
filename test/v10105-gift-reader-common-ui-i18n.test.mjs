import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync('app/src/main/assets/www/index.html','utf8');

test('gift reader common UI is refreshed from current LanguageManager language',()=>{
  assert.match(html,/const refreshCommonUi=\(\)=>/);
  assert.match(html,/t\('gift\.readerKicker','SHIZUKURUからの おくりもの'\)/);
  assert.match(html,/t\('gift\.readerBack','図鑑にもどる'\)/);
  assert.match(html,/t\('gift\.use','この色を使う'\)/);
  assert.match(html,/t\('gift\.readerAria','しずくるからの贈り物'\)/);
});

test('gift reader refreshes common UI when opened and when language changes',()=>{
  assert.match(html,/ensure\(\);\s*refreshCommonUi\(\);\s*const color=gift\.color/);
  assert.match(html,/document\.addEventListener\('shizuku:languagechange',\(\)=>\{try\{refreshCommonUi\(\)\}/);
});

test('gift reader does not bake translated common UI into one-time innerHTML',()=>{
  const start=html.indexOf("const refreshCommonUi=()=>");
  const end=html.indexOf("function open(id)",start);
  const block=html.slice(start,end);
  assert.doesNotMatch(block,/\$\{window\.LanguageManager\?\.translate\?\.\('gift\.readerBack'\)/);
  assert.doesNotMatch(block,/\$\{window\.LanguageManager\?\.translate\?\.\('gift\.use'\)/);
});
