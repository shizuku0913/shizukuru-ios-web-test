import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const html=fs.readFileSync('app/src/main/assets/www/index.html','utf8');
test('Arabic never flips the application root geometry',()=>{assert.doesNotMatch(html,/document\.documentElement\.dir=next==='ar'/);assert.match(html,/document\.documentElement\.dir='ltr'/);assert.match(html,/dataset\.textDirection=next==='ar'\?'rtl':'ltr'/)});
test('canvas and interaction geometry stay LTR under Arabic',()=>{assert.match(html,/html\[data-text-direction="rtl"\].*canvas[\s\S]*direction:ltr/)});
test('system generated names use locale packs instead of English fallback',()=>{assert.match(html,/ShizukuruOptionalGeneratedNames/);assert.match(html,/if\(language==='en'\)/)});
test('gift narrative uses locale-specific copy outside Japanese',()=>{assert.match(html,/const language=window\.LanguageManager\?\.currentLanguage/);assert.match(html,/ShizukuruOptionalGiftCopy/);assert.match(html,/const giftEnglish=Object\.freeze/)});
