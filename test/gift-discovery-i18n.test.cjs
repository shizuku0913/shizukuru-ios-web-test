const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const index=fs.readFileSync(path.join(__dirname,'..','app','src','main','assets','www','index.html'),'utf8');

test('all 21 gift IDs have English literary copy',()=>{
  const marker='const giftEnglish=Object.freeze(';
  const start=index.indexOf(marker);
  assert.notEqual(start,-1);
  const body=start+marker.length;
  let depth=0,inString=false,quote='',escaped=false,end=-1;
  for(let i=body;i<index.length;i++){
    const ch=index[i];
    if(inString){if(escaped){escaped=false;continue}if(ch==='\\'){escaped=true;continue}if(ch===quote){inString=false;quote=''}continue}
    if(ch==='"'||ch==="'"){inString=true;quote=ch;continue}
    if(ch==='{')depth++;
    if(ch==='}'&&--depth===0){end=i+1;break}
  }
  const data=JSON.parse(index.slice(body,end));
  assert.equal(Object.keys(data).length,21);
  for(let i=1;i<=21;i++){
    const id=`gift-${String(i).padStart(2,'0')}`;
    assert.ok(data[id]?.title?.trim(),id+' title');
    assert.ok(data[id]?.comment?.trim(),id+' comment');
    assert.ok(data[id]?.colorMeaning?.trim(),id+' colorMeaning');
  }
});

test('gift translation is keyed by stable IDs and does not change gift progress range',()=>{
  assert.match(index,/const localizedGift=gift=>/);
  assert.match(index,/getById\(id\)\{const gift=byId\.get\(String\(id\)\)/);
  assert.match(index,/giftRangeMin:300/);
  assert.match(index,/giftRangeMax:500/);
});

test('discovery messages use translation keys without changing discovery state names',()=>{
  for(const state of ['found','repeat','near-improved','near','target-found','my-ready','my-confirmed','my-improved','my-near']){
    assert.match(index,new RegExp(`state==='${state.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}'`));
  }
  assert.match(index,/appText\('discovery\.found\.lead'\)/);
  assert.match(index,/appText\('discovery\.near\.lead'/);
});
