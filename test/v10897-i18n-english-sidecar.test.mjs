import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ja } from '../app/src/main/assets/www/i18n/ja.js';
import { en } from '../app/src/main/assets/www/i18n/en.js';

const bootstrap=fs.readFileSync(new URL('../app/src/main/assets/www/i18n/bootstrap.js', import.meta.url),'utf8');

test('v10.8.97 English dictionary mirrors the Japanese key set exactly',()=>{
  assert.ok(Object.keys(ja).length>=380);
  assert.equal(Object.keys(en).length,Object.keys(ja).length);
  assert.deepEqual(Object.keys(en).sort(),Object.keys(ja).sort());
});

test('English dictionary is passive while Japanese remains the default',()=>{
  assert.match(bootstrap,/import \{ en \} from '\.\/en\.js'/);
  assert.match(bootstrap,/initialLanguage/);
  assert.doesNotMatch(bootstrap,/localStorage|MutationObserver|addEventListener/);
});

test('all English entries are usable strings and preserve required placeholders',()=>{
  for(const [key,value] of Object.entries(en)){
    assert.equal(typeof value,'string',key);
    assert.ok(value.length>0,key);
    const jaVars=[...ja[key].matchAll(/\{([^}]+)\}/g)].map(m=>m[1]).sort();
    const enVars=[...value.matchAll(/\{([^}]+)\}/g)].map(m=>m[1]).sort();
    assert.deepEqual(enVars,jaVars,`${key} placeholders`);
  }
});
