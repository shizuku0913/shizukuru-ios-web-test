
import fs from 'node:fs';
import {reproductionRecipes,mixingEngine,classification,official,rgb} from './test/production-mixing-utils.js';

const pigments=['#000000','#ff0000','#00ff00','#0000ff','#00ffff','#ff00ff','#ffff00','#ffffff'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
let state=0x1052A11; const rnd=()=>((state=(1664525*state+1013904223)>>>0)/4294967296);

function vec(rec){
  const w=pigments.map(h=>rec.recipe.find(r=>r.hex===h)?.ratio||0);
  const s=w.reduce((a,b)=>a+b,0)||1;
  return {w:w.map(x=>x/s),water:rec.waterLevel};
}
function mix(v){
  const sources=new Map();
  v.w.forEach((x,i)=>{if(x>1e-10)sources.set(pigments[i],x)});
  return mixingEngine.mixAggregate({total:1,sources,waterLevel:clamp(v.water,0,1),mixLevel:1}).map(Math.round);
}
function norm(w){
  w=w.map(x=>Math.max(0,x)); const s=w.reduce((a,b)=>a+b,0)||1; return w.map(x=>x/s);
}
function mutate(v,scale){
  const w=v.w.slice();
  const n=1+Math.floor(rnd()*3);
  for(let k=0;k<n;k++){
    const i=Math.floor(rnd()*8);
    w[i]=Math.max(0,w[i]+(rnd()*2-1)*scale);
  }
  return {w:norm(w),water:clamp(v.water+(rnd()*2-1)*scale,0,1)};
}
function score(name,v){
  const color=mix(v);
  const target=rgb(official.find(x=>x.name===name).hex);
  const strict=classification.nearestStrictOfficialRGB(...color);
  const ok=strict.entry?.name===name;
  const p=strict.perception;
  const targetD=dist(color,target);
  const radius=p?.adaptiveRadius??0;
  // Prefer strict pass, then smallest target distance, then minimal movement from current later.
  return {v,color,targetD,ok,radius,perception:p};
}
const results={};
for(const name of ['オレンジ','あたらしいしゃぼんだまいろ']){
  const base=vec(reproductionRecipes[name]);
  let pool=[score(name,base)];
  for(const scale of [.03,.015,.008,.004,.002,.001,.0005]){
    const seeds=pool.slice().sort((a,b)=>(b.ok-a.ok)||a.targetD-b.targetD).slice(0,12);
    const next=[...seeds];
    for(const seed of seeds){
      for(let j=0;j<400;j++) next.push(score(name,mutate(seed.v,scale)));
    }
    pool=next.sort((a,b)=>(b.ok-a.ok)||a.targetD-b.targetD).slice(0,40);
  }
  const passing=pool.filter(x=>x.ok).sort((a,b)=>a.targetD-b.targetD);
  const best=passing[0]||pool[0];
  const recipe=best.v.w.map((ratio,i)=>({hex:pigments[i],ratio})).filter(x=>x.ratio>1e-8);
  results[name]={...best,recipe,waterLevel:best.v.water};
}
fs.writeFileSync('TWO-COLOR-STRICT-FIX.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
