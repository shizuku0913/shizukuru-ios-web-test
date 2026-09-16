import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync(new URL('../app/src/main/assets/www/index.html', import.meta.url), 'utf8');
const core = fs.readFileSync(new URL('../app/src/main/assets/www/i18n/core.js', import.meta.url), 'utf8');
const bootstrap = fs.readFileSync(new URL('../app/src/main/assets/www/i18n/bootstrap.js', import.meta.url), 'utf8');
const ja = fs.readFileSync(new URL('../app/src/main/assets/www/i18n/ja.js', import.meta.url), 'utf8');

test('v10.8.96 connects Japanese through the isolated i18n provider', () => {
  assert.match(index, /window\.ShizukuruI18nNext/);
  assert.match(index, /external\.has\(key(?:,language)?\)/);
  assert.match(index, /external\.t\(key,params\|\|\{\}(?:,language)?\)/);
  assert.match(bootstrap, /mode: 'connected-ja(?:-en(?:-zh-cn(?:-ko)?)?)?'/);
});

test('v10.8.96 module adds no storage, observer, or listener side effects', () => {
  for (const source of [core, bootstrap, ja]) {
    assert.doesNotMatch(source, /localStorage\./);
    assert.doesNotMatch(source, /MutationObserver/);
    assert.doesNotMatch(source, /addEventListener\s*\(/);
  }
});

test('external Japanese dictionary covers every inline Japanese key', () => {
  const start = index.indexOf('ja:Object.freeze({', index.indexOf('const dictionaries=Object.freeze'));
  const end = index.indexOf('    }),\n    en:Object.freeze({', start);
  assert.ok(start >= 0 && end > start);
  const inlineJa = index.slice(start, end);
  const keyPattern = /'([^']+)'\s*:/g;
  const keys = source => new Set([...source.matchAll(keyPattern)].map(match => match[1]));
  const oldKeys = keys(inlineJa);
  const moduleKeys = keys(ja);
  assert.equal(moduleKeys.size, oldKeys.size);
  assert.deepEqual([...oldKeys].filter(key => !moduleKeys.has(key)), []);
});
