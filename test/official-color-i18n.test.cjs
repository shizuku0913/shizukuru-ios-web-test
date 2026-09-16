const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const index=fs.readFileSync(path.join(__dirname,'..','app','src','main','assets','www','index.html'),'utf8');

function parseJsonConst(name, open, close){
  const marker=`const ${name}=Object.freeze(`;
  const start=index.indexOf(marker);
  assert.notEqual(start,-1,`${name} must exist in production index.html`);
  const bodyStart=start+marker.length;
  let depth=0, inString=false, quote='', escaped=false;
  for(let i=bodyStart;i<index.length;i++){
    const ch=index[i];
    if(inString){
      if(escaped){escaped=false;continue}
      if(ch==='\\'){escaped=true;continue}
      if(ch===quote){inString=false;quote=''}
      continue;
    }
    if(ch==='"'||ch==="'"){inString=true;quote=ch;continue}
    if(ch===open)depth++;
    if(ch===close){
      depth--;
      if(depth===0)return JSON.parse(index.slice(bodyStart,i+1));
    }
  }
  throw new Error(`Could not parse ${name}`);
}

test('all 350 official Japanese canonical names have a non-empty English display name',()=>{
  const names=parseJsonConst('OFFICIAL_ENCYCLOPEDIA_NAMES','[',']');
  const english=parseJsonConst('OFFICIAL_ENGLISH_DISPLAY_NAMES','{','}');
  assert.equal(names.length,350);
  assert.equal(new Set(names).size,350);
  const missing=names.filter(name=>typeof english[name]!=='string'||!english[name].trim());
  assert.deepEqual(missing,[]);
  assert.equal(Object.keys(english).length,350);
});

test('official color localization remains presentation-only',()=>{
  assert.match(index,/function officialColorDisplayName\(name\)/);
  assert.match(index,/OFFICIAL_ENGLISH_DISPLAY_NAMES/);
  assert.match(index,/normalizeOfficialEncyclopediaName/);
  // Canonical recognition truth stays Japanese and is not rewritten.
  assert.match(index,/const OFFICIAL_ENCYCLOPEDIA_NAMES=Object\.freeze\(\["あか","だいだい","きいろ"/);
});
