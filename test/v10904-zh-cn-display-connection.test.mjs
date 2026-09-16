import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const html=fs.readFileSync('app/src/main/assets/www/index.html','utf8'),boot=fs.readFileSync('app/src/main/assets/www/i18n/bootstrap.js','utf8'),core=fs.readFileSync('app/src/main/assets/www/i18n/core.js','utf8');
test('Simplified Chinese remains available in language UI',()=>{assert.match(html,/<option value="zh-CN">简体中文<\/option>/)});
test('host manager accepts zh-CN without embedding a duplicate dictionary',()=>{assert.match(html,/'zh-CN':Object\.freeze\(\{\}\)/)});
test('isolated provider loads real zh-CN dictionary',()=>{assert.match(boot,/import \{ zhCN \} from '\.\/zh-CN\.js'/);assert.match(boot,/'zh-CN': zhCN/)});
test('provider mode declares three-language connection',()=>{assert.match(boot,/connected-ja-en-zh-cn/)});
test('i18n core still owns no storage observers or event listeners',()=>{assert.doesNotMatch(core,/localStorage|MutationObserver|ResizeObserver|addEventListener/)});
