import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const ROOT='app/src/main/assets/www';
const html=fs.readFileSync(`${ROOT}/index.html`,'utf8');
const optional=['es','fr','de','it','pt-BR','zh-TW','th','id','vi','ru','ar','hi'];

function loadPack(code){
  let s=fs.readFileSync(`${ROOT}/i18n/packs/${code}.js`,'utf8');
  s=s
    .replace(/export const dictionary\s*=/,'globalThis.dictionary=')
    .replace(/export const officialNames\s*=/,'globalThis.officialNames=')
    .replace(/export const generatedNames\s*=/,'globalThis.generatedNames=')
    .replace(/export const giftCopy\s*=/,'globalThis.giftCopy=');
  const c={};vm.createContext(c);vm.runInContext(s,c);return c;
}
function loadCore(path,name){
  let s=fs.readFileSync(`${ROOT}/i18n/${path}`,'utf8').replace(new RegExp(`export const ${name}\\s*=`),`globalThis.${name}=`);
  const c={};vm.createContext(c);vm.runInContext(s,c);return c[name];
}

test('all 12 optional languages localize every current AI candidate and all 21 gifts',()=>{
  for(const code of optional){
    const p=loadPack(code);
    assert.equal(Object.keys(p.generatedNames).length,430,`${code} generated names`);
    assert.equal(Object.keys(p.giftCopy).length,21,`${code} gifts`);
    for(let i=1;i<=21;i++){
      const id=`gift-${String(i).padStart(2,'0')}`;
      assert.ok(p.giftCopy[id]?.title?.trim(),`${code}:${id}:title`);
      assert.ok(p.giftCopy[id]?.comment?.trim(),`${code}:${id}:comment`);
      assert.ok(p.giftCopy[id]?.colorMeaning?.trim(),`${code}:${id}:colorMeaning`);
    }
  }
});

test('Simplified Chinese and Korean core packs also cover AI candidates and gifts',()=>{
  assert.equal(Object.keys(loadCore('generated-names-zh-CN.js','generatedNamesZhCN')).length,430);
  assert.equal(Object.keys(loadCore('generated-names-ko.js','generatedNamesKo')).length,430);
  assert.equal(Object.keys(loadCore('gift-copy-zh-CN.js','giftCopyZhCN')).length,21);
  assert.equal(Object.keys(loadCore('gift-copy-ko.js','giftCopyKo')).length,21);
});

test('reported generated-name examples are Spanish rather than English',()=>{
  const es=loadPack('es').generatedNames;
  assert.equal(es['ラムネの湖'],'Lago de ramune');
  assert.equal(es['空の小窓'],'Ventana al cielo');
  assert.equal(es['星空ゼリー'],'Gelatina de cielo estrellado');
  assert.equal(es['かわいいうさぎの夢'],'Sueño del conejito');
});

test('candidate names are source-aware while user-typed names remain literal',()=>{
  assert.match(html,/entry\.nameSource='candidate'/);
  assert.match(html,/entry\.nameSource='custom'/);
  assert.match(html,/function localizedMyColorName\(entryOrName\)/);
  assert.match(html,/if\(entry\?\.nameSource==='custom'\)return raw/);
  assert.match(html,/Array\.isArray\(entry\?\.candidates\)\&\&entry\.candidates\.includes\(raw\)/);
});

test('English fallback is used only when the selected language is English',()=>{
  const start=html.indexOf('function localizedGeneratedColorName(name)');
  const end=html.indexOf('function localizedMyColorName',start);
  const fn=html.slice(start,end);
  assert.match(fn,/if\(language==='en'\)/);
  assert.match(fn,/ShizukuruOptionalGeneratedNames/);
  assert.ok(fn.indexOf("if(language==='en'){") < fn.indexOf('ShizukuruOptionalGeneratedNames'));
  assert.match(fn,/if\(localized\)return localized;/);

  const giftStart=html.indexOf('const localizedGift=gift=>');
  const giftEnd=html.indexOf('const categories=',giftStart);
  const giftFn=html.slice(giftStart,giftEnd);
  assert.match(giftFn,/if\(language==='en'\)/);
  assert.match(giftFn,/ShizukuruOptionalGiftCopy/);
});
