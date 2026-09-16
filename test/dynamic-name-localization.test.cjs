const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const index=fs.readFileSync(path.join(__dirname,'..','app','src','main','assets','www','index.html'),'utf8');

test('system generated name vocabulary has English display mappings for reported examples',()=>{
  for(const pair of [
    ['空色ラムネ','Sky-Blue Ramune'],
    ['はじける雲の王さま','Sparkling King of the Clouds'],
    ['ほっとする時間','A Quiet Moment'],
    ['青空','Blue Sky'],
    ['きらめき森のこびとの帽子','Shimmering Forest Gnome’s Hat'],
    ['抹茶クリーム','Matcha Cream'],
    ['ミントゼリー','Mint Jelly'],
    ['水色キャンディ','Aqua Candy'],
    ['おやすみの色','Bedtime Color']
  ]){
    assert.ok(index.includes(JSON.stringify(pair[0]).slice(1,-1)) || index.includes(pair[0]),pair[0]);
    assert.ok(index.includes(pair[1]),pair[1]);
  }
});

test('system suggestions are localized only at presentation boundary',()=>{
  assert.match(index,/function localizedGeneratedColorName\(name\)/);
  assert.match(index,/b\.textContent=localizedGeneratedColorName\(name\)/);
  assert.match(index,/entry\.name=name/); // raw Japanese identity remains stored
  assert.match(index,/localizedMyColorName\(item\)/);
  assert.match(index,/entry\.nameSource='candidate'/);
});

test('duplicate naming copy is suppressed',()=>{
  assert.match(index,/#researchNamingSection>\.research-copy\{display:none\}/);
});

test('user custom names are preserved rather than machine translated',()=>{
  const fn=index.slice(index.indexOf('function localizedMyColorName'),index.indexOf('function localizedAnyColorName'));
  assert.match(fn,/nameSource==='custom'/);
  assert.match(fn,/return raw;/);
});
