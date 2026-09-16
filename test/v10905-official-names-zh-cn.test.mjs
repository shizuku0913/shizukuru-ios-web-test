import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const html=fs.readFileSync('app/src/main/assets/www/index.html','utf8'),boot=fs.readFileSync('app/src/main/assets/www/i18n/bootstrap.js','utf8');
const src=fs.readFileSync('app/src/main/assets/www/i18n/official-names-zh-CN.js','utf8').replace(/export const officialNamesZhCN\s*=/,'globalThis.__d=');
const c={};vm.createContext(c);vm.runInContext(src,c);const names=c.__d;
test('all 350 official colors have Simplified Chinese display names',()=>assert.equal(Object.keys(names).length,350));
test('known leaked examples are translated',()=>{assert.equal(names['もぐらいろ'],'鼹鼠');assert.equal(names['せんたくしたぺんぎんいろ'],'洗得干干净净的企鹅');assert.equal(names['ラベンダーグレー'],'薰衣草灰色');assert.equal(names['うすいみどり'],'浅绿色')});
test('official name translation is display-only',()=>{assert.match(html,/if\(language==='zh-CN'\)/);assert.match(html,/ShizukuruOfficialNamesZhCN/);assert.match(boot,/official-names-zh-CN\.js/)});
test('Chinese official display names contain no Japanese kana',()=>{for(const [k,v] of Object.entries(names))assert.doesNotMatch(v,/[\u3040-\u30ff]/,k)});
