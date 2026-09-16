const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/www/index.html'),'utf8');

test('provisional sample does not freeze the current attempt count into target name',()=>{
  const tryTarget=html.match(/tryTarget\(\)\{[\s\S]*?closeEncyclopedia\(\);\s*\},/);
  assert.ok(tryTarget,'tryTarget block missing');
  assert.match(tryTarget[0],/TargetColorController\.set\(entry\)/);
  assert.doesNotMatch(tryTarget[0],/TargetColorController\.set\(\{[\s\S]*?回近づいた/);
});

test('target controller derives unnamed research label from live attempts',()=>{
  const setBlock=html.match(/set\(entry\)\{[\s\S]*?return true;\s*\},\s*clear\(/);
  assert.ok(setBlock,'TargetColorController.set block missing');
  assert.match(setBlock[0],/entry\.status==='confirmed'&&entry\.name\?entry\.name:''/);
  assert.match(html,/return atelierTargetColor\.kind==='my'\?\(atelierTargetColor\.name\?localizedMyColorName\(atelierTargetColor\):`\$\{Math\.max\(1,atelierTargetColor\.attempts\|\|1\)\}回近づいた`\)/);
});

test('both near-reproduction paths synchronize active target attempts',()=>{
  assert.match(html,/classification\.kind==='my-near'[\s\S]*?updateAtelierTargetAttempts\(repro\.entry\.attempts\)/);
  assert.match(html,/if\(nearExisting\)\{[\s\S]*?updateAtelierTargetAttempts\(entry\.attempts\)[\s\S]*?showDiscoveryCard\([\s\S]*?'my-near'\)/);
});

test('target placed announcement uses the same live label as the sample',()=>{
  const setBlock=html.match(/set\(entry\)\{[\s\S]*?return true;\s*\},\s*clear\(/);
  assert.ok(setBlock);
  assert.match(setBlock[0],/appText\('atelier\.targetPlaced',\{name:this\.label\(\)\}\)/);
});
