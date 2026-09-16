import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs'; import vm from 'node:vm';

const html=fs.readFileSync('app/src/main/assets/www/index.html','utf8');
const boot=fs.readFileSync('app/src/main/assets/www/i18n/bootstrap.js','utf8');
const core=fs.readFileSync('app/src/main/assets/www/i18n/core.js','utf8');

function load(path,name){
  const s=fs.readFileSync(path,'utf8').replace(new RegExp(`export const ${name}\\s*=`),'globalThis.__d=');
  const c={}; vm.createContext(c); vm.runInContext(s,c); return c.__d;
}
const ko=load('app/src/main/assets/www/i18n/ko.js','ko');
const names=load('app/src/main/assets/www/i18n/official-names-ko.js','officialNamesKo');

test('language UI exposes Korean',()=>{
  assert.match(html,/<option value="ko">한국어<\/option>/);
});
test('host LanguageManager accepts Korean without embedding the full dictionary',()=>{
  assert.match(html,/ko:Object\.freeze\(\{\}\)/);
});
test('isolated provider loads Korean UI and official-name modules',()=>{
  assert.match(boot,/import \{ ko \} from '\.\/ko\.js'/);
  assert.match(boot,/import \{ officialNamesKo \} from '\.\/official-names-ko\.js'/);
  assert.match(boot,/Object\.freeze\(\{ ja, en, 'zh-CN': zhCN, ko \}\)/);
  assert.match(boot,/connected-ja-en-zh-cn-ko/);
});
test('official display-name resolver supports Korean',()=>{
  assert.match(html,/if\(language==='ko'\)/);
  assert.match(html,/ShizukuruOfficialNamesKo/);
});
test('Korean connected resources remain complete',()=>{
  assert.equal(Object.keys(ko).length,387);
  assert.equal(Object.keys(names).length,350);
});
test('isolated i18n core still adds no storage, observers, or event listeners',()=>{
  assert.doesNotMatch(core,/localStorage|MutationObserver|ResizeObserver|addEventListener/);
});
