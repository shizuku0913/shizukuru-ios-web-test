import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('app/src/main/assets/www/index.html','utf8');
const core=fs.readFileSync('app/src/main/assets/www/i18n/core.js','utf8');
const boot=fs.readFileSync('app/src/main/assets/www/i18n/bootstrap.js','utf8');
const ja=fs.readFileSync('app/src/main/assets/www/i18n/ja.js','utf8');

test('v10.8.95 loads the new i18n module separately',()=>{
  assert.match(html,/type="module" src="\.\/i18n\/bootstrap\.js"/);
  assert.match(boot,/mode:\s*'(?:shadow|connected-ja|connected-ja-en|connected-ja-en-zh-cn|connected-ja-en-zh-cn-ko)'/);
});

test('shadow i18n has no write/listener/storage side effects',()=>{
  for(const forbidden of ['localStorage','sessionStorage','MutationObserver','addEventListener','dispatchEvent','textContent =','innerHTML =','setAttribute(']) {
    assert.ok(!core.includes(forbidden),forbidden);
    assert.ok(!boot.includes(forbidden),forbidden);
  }
});

test('Japanese dictionary is data-only and external to index',()=>{
  assert.match(ja,/export const ja = Object\.freeze\(/);
  assert.ok(!ja.includes('document.'));
  assert.ok(!ja.includes('window.'));
});
