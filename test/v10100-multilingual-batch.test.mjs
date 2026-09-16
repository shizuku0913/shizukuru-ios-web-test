import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const CODES=['es','fr','de','it','pt-BR','zh-TW','th','id','vi','ru','ar','hi'];
const read=p=>fs.readFileSync(p,'utf8');
function loadObject(source,exportName){
  const transformed=source
    .replace(/export const dictionary\s*=/,'globalThis.dictionary=')
    .replace(/export const officialNames\s*=/,'globalThis.officialNames=')
    .replace(/export const generatedNames\s*=/,'globalThis.generatedNames=')
    .replace(/export const giftCopy\s*=/,'globalThis.giftCopy=')
    .replace(/export const en\s*=/,'globalThis.en=');
  const c={}; vm.createContext(c); vm.runInContext(transformed,c); return c[exportName];
}
const en=loadObject(read('app/src/main/assets/www/i18n/en.js'),'en');
const ph=s=>[...String(s).matchAll(/\{[^}]+\}/g)].map(x=>x[0]).sort();

test('all 12 optional packs ship 387 UI keys and 350 official display names',async()=>{
  for(const code of CODES){
    const source=read(`app/src/main/assets/www/i18n/packs/${code}.js`);
    const dictionary=loadObject(source,'dictionary');
    const officialNames=loadObject(source,'officialNames');
    assert.equal(Object.keys(dictionary).length,387,`${code} UI key count`);
    assert.equal(Object.keys(officialNames).length,350,`${code} official-name count`);
    assert.deepEqual(Object.keys(dictionary).sort(),Object.keys(en).sort(),`${code} key alignment`);
  }
});

test('all optional-pack placeholders match English source exactly',()=>{
  for(const code of CODES){
    const dictionary=loadObject(read(`app/src/main/assets/www/i18n/packs/${code}.js`),'dictionary');
    for(const key of Object.keys(en)) assert.deepEqual(ph(dictionary[key]),ph(en[key]),`${code}:${key}`);
  }
});

test('official display-name maps never expose Japanese kana',()=>{
  for(const code of CODES){
    const officialNames=loadObject(read(`app/src/main/assets/www/i18n/packs/${code}.js`),'officialNames');
    for(const [key,value] of Object.entries(officialNames)) assert.doesNotMatch(String(value),/[\u3040-\u30ff]/,`${code}:${key}`);
  }
});

test('registry declares exactly the 12 optional language packs',()=>{
  const registry=read('app/src/main/assets/www/i18n/language-registry.js');
  for(const code of CODES) assert.ok(registry.includes(`'${code}'`)||registry.includes(`${code}:`),code);
  assert.match(registry,/import\('\.\/packs\/es\.js'\)/);
  assert.match(registry,/import\('\.\/packs\/hi\.js'\)/);
});

test('language selector exposes all 16 supported languages in one native select',()=>{
  const html=read('app/src/main/assets/www/index.html');
  assert.match(html,/id="appLanguageSelect"/);
  const options=[...html.matchAll(/<option value="([^"]+)"/g)].map(x=>x[1]);
  for(const code of ['ja','en','zh-CN','ko',...CODES]) assert.ok(options.includes(code),code);
  assert.equal(new Set(options).size,16);
});

test('Arabic uses scoped text direction without flipping app geometry',()=>{
  const html=read('app/src/main/assets/www/index.html');
  assert.match(html,/document\.documentElement\.dir='ltr'/);
  assert.match(html,/dataset\.textDirection=next==='ar'\?'rtl':'ltr'/);
});

test('optional language packs are lazy-loaded rather than statically imported at startup',()=>{
  const boot=read('app/src/main/assets/www/i18n/bootstrap.js');
  for(const code of CODES) assert.doesNotMatch(boot,new RegExp(`from '\\.\\/packs\\/${code.replace('-','\\-')}\\.js'`));
  assert.match(boot,/installLanguageRegistry/);
});
