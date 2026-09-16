import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = p => fs.readFileSync(new URL(p, root), 'utf8');
const html = read('./app/src/main/assets/www/index.html');
const core = read('./app/src/main/assets/www/i18n/core.js');
const boot = read('./app/src/main/assets/www/i18n/bootstrap.js');
const jaSrc = read('./app/src/main/assets/www/i18n/ja.js');
const enSrc = read('./app/src/main/assets/www/i18n/en.js');

function dictionary(src, name) {
  const transformed = src.replace(new RegExp(`export const ${name}\\s*=`), `globalThis.__dict =`);
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(transformed, ctx);
  return ctx.__dict;
}
const ja = dictionary(jaSrc, 'ja');
const en = dictionary(enSrc, 'en');

test('JA and EN dictionaries stay key-identical', () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(ja).sort());
});

test('isolated core supports explicit JA/EN switching without storage or listeners', () => {
  assert.match(core, /setLanguage\(next\)/);
  assert.match(core, /connected-ja-en(?:-zh-cn(?:-ko)?)?/);
  assert.doesNotMatch(core, /localStorage|addEventListener|MutationObserver|ResizeObserver/);
});

test('bootstrap loads both dictionaries and does not own persistence/listeners', () => {
  assert.match(boot, /import \{ ja \}/);
  assert.match(boot, /import \{ en \}/);
  assert.match(boot, /connected-ja-en(?:-zh-cn(?:-ko)?)?/);
  assert.doesNotMatch(boot, /localStorage|addEventListener|MutationObserver|ResizeObserver/);
});

test('host LanguageManager delegates translations to external module for current language', () => {
  assert.match(html, /external\.setLanguage\(language\)/);
  assert.match(html, /external\.has\(key,language\)/);
  assert.match(html, /external\.t\(key,params\|\|\{\},language\)/);
});

test('language control still exposes JA and EN after later selector upgrades', () => {
  assert.match(html, /id="appLanguageSelect"/);
  assert.match(html, /<option value="ja">日本語<\/option>/);
  assert.match(html, /<option value="en">English<\/option>/);
});

test('representative English strings are real translations', () => {
  assert.equal(en['parent.title'], 'For Parents');
  assert.equal(en['nav.encyclopedia'], 'Color Book');
  assert.notEqual(en['draw.settings'], ja['draw.settings']);
});
