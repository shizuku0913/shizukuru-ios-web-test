const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const index=fs.readFileSync(path.join(__dirname,'..','app','src','main','assets','www','index.html'),'utf8');

test('drawing settings expose persistent language controls',()=>{
  const settings=index.slice(index.indexOf('id="drawSettingsMenu"'),index.indexOf('id="philosophyOverlay"'));
  assert.match(settings,/id="appLanguageSelect"/);
  assert.match(settings,/<option value="ja">日本語<\/option>/);
  assert.match(settings,/<option value="en">English<\/option>/);
  assert.match(settings,/言語 \/ Language/);
});

test('parent area no longer owns language controls',()=>{
  const parent=index.slice(index.indexOf('id="parentAreaOverlay"'),index.indexOf('id="memoryLetterOverlay"'));
  assert.doesNotMatch(parent,/appLanguageSelect/);
});

test('language selection uses persistent LanguageManager',()=>{
  assert.match(index,/window\.LanguageManager\.setLanguage\(next,\{persist:true\}\)/);
  assert.match(index,/localStorage\.setItem\(STORAGE_KEY,next\)/);
  assert.match(index,/const STORAGE_KEY='shizuku-language'/);
  assert.match(index,/syncLanguageSelect/);
  assert.match(index,/id="appLanguageSelect"/);
});

test('first launch follows device language and unsupported locales fall back to English',()=>{
  assert.match(index,/const normalizeDeviceLanguage=/);
  assert.match(index,/navigator\.languages&&navigator\.languages\[0\]/);
  assert.match(index,/navigator\.language/);
  assert.match(index,/return byPrimary\[primary\]\|\|'en'/);
  assert.match(index,/language=normalizeDeviceLanguage\(deviceLanguage\)/);
  assert.match(index,/localStorage\.setItem\(STORAGE_KEY,language\)/);
});

test('saved app language wins over device language on later launches',()=>{
  const saved=index.indexOf("if(saved && dictionaries[saved])");
  const device=index.indexOf('language=normalizeDeviceLanguage(deviceLanguage)');
  assert.ok(saved>=0 && device>saved);
});
