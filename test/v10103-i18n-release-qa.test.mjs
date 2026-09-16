import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('app/src/main/assets/www/index.html','utf8');
const core=fs.readFileSync('app/src/main/assets/www/i18n/core.js','utf8');
const bootstrap=fs.readFileSync('app/src/main/assets/www/i18n/bootstrap.js','utf8');

test('my-color names remain a separate persistence domain and are not rewritten on language change',()=>{
  assert.match(html,/User-entered custom names are intentionally preserved exactly as entered/);
  assert.match(html,/return raw;\s*\n}/); // unknown/custom names pass through unchanged
  assert.doesNotMatch(core,/setItem\([^\n]*name/i);
});

test('language choice is persisted and restored through the language manager',()=>{
  assert.match(html,/localStorage\.getItem\(STORAGE_KEY\)/);
  assert.match(html,/localStorage\.setItem\(STORAGE_KEY,next\)/);
  assert.match(html,/currentLanguage\(\)/);
  assert.match(bootstrap,/LanguageManager/);
});

test('RTL is scoped to text while application geometry remains LTR',()=>{
  assert.match(html,/document\.documentElement\.dir='ltr'/);
  assert.match(html,/dataset\.textDirection=next==='ar'\?'rtl':'ltr'/);
});

test('rare save-share and gift surfaces are routed through translation keys',()=>{
  for(const key of ['gift.arrivalTitle','gift.arrivalCopy','gift.tap','gift.readerBack','gift.use']) assert.ok(html.includes(key),key);
  assert.match(html,/LanguageManager\?\.translate/);
});
