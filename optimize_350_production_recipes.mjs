
import fs from 'node:fs';
import {officialNames,reproductionRecipes,mixingEngine,canonical,rgb} from './test/production-mixing-utils.js';

const pigments=[
 {name:'くろ',hex:'#000000'},{name:'あか',hex:'#ff0000'},{name:'みどり',hex:'#00ff00'},{name:'あお',hex:'#0000ff'},
 {name:'シアン',hex:'#00ffff'},{name:'マゼンタ',hex:'#ff00ff'},{name:'きいろ',hex:'#ffff00'},{name:'しろ',hex:'#ffffff'}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
let state=0x10851; const rnd=()=>((state=(1664525*state+1013904223)>>>0)/4294967296);
function normalize(w){const s=w.reduce((a,b)=>a+b,0)||1;return w.map(x=>Math.max(0,x)/s)}
function mix(w,water){
 const sources=new Map();w.forEach((x,i)=>{if(x>1e-8)sources.set(pigments[i].hex,x)});
 if(!sources.size){sources.set('#ffffff',1)}
 const result=mixingEngine.mixAggregate({total:1,sources,waterLevel:clamp(water,0,1),mixLevel:1});
 return (result||[255,255,255]).map(Math.round);
}
function currentVector(rec){
 const w=pigments.map(p=>rec.recipe.find(r=>r.hex===p.hex)?.ratio||0);
 return {w:normalize(w),water:rec.waterLevel};
}
function randomVec(){
 const w=Array(8).fill(0);
 const pool=[0,1,2,3,4,5,6,7];
 const k=1+Math.floor(rnd()*5);
 for(let j=0;j<k;j++){
   const pos=Math.floor(rnd()*pool.length),i=pool.splice(pos,1)[0];
   w[i]=-Math.log(Math.max(1e-12,1-rnd()));
 }
 return normalize(w);
}
function mutate(v,scale=.12){
 let w=v.w.slice();
 const changes=1+Math.floor(rnd()*3);
 for(let c=0;c<changes;c++){
  const i=Math.floor(rnd()*8);
  w[i]=Math.max(0,w[i]+(rnd()*2-1)*scale);
 }
 if(rnd()<.08)w[Math.floor(rnd()*8)]=rnd()*.2;
 w=normalize(w);
 return {w,water:clamp(v.water+(rnd()*2-1)*scale,0,1)};
}
function score(v,target){
 const color=mix(v.w,v.water), d=dist(color,target);
 const active=v.w.filter(x=>x>.003).length;
 return {d,color,complexity:active};
}
const optimized={};
const report=[];
for(let ni=0;ni<officialNames.length;ni++){
 const name=officialNames[ni], target=rgb(canonical.find(c=>c.name===name).hex), old=currentVector(reproductionRecipes[name]);
 let candidates=[old,{w:pigments.map(p=>p.name===name?1:0),water:0}];
 // Broad deterministic search.
 for(let i=0;i<450;i++)candidates.push({w:randomVec(),water:rnd()});
 let scored=candidates.map(v=>({v,...score(v,target)})).sort((a,b)=>a.d-b.d||a.complexity-b.complexity).slice(0,8);
 // Annealed local refinement around the best diverse starts.
 for(const scale of [.12,.06,.03,.015,.0075,.003]){
  const next=scored.slice(0,8);
  for(const seed of scored.slice(0,6)){
   for(let j=0;j<18;j++){
    const v=mutate(seed.v,scale);
    next.push({v,...score(v,target)});
   }
  }
  scored=next.sort((a,b)=>a.d-b.d||a.complexity-b.complexity).slice(0,8);
 }
 const best=scored[0], w=best.v.w.map(x=>x<.001?0:x), wn=normalize(w);
 const recipe=wn.map((ratio,i)=>({name:pigments[i].name,hex:pigments[i].hex,ratio})).filter(r=>r.ratio>0);
 const color=mix(wn,best.v.water);
 const hex='#'+color.map(x=>x.toString(16).padStart(2,'0')).join('');
 optimized[name]={recipe,waterLevel:best.v.water,predictedHex:hex};
 const oldColor=mix(old.w,old.water),oldD=dist(oldColor,target);
 report.push({name,target:canonical.find(c=>c.name===name).hex,oldHex:'#'+oldColor.map(x=>x.toString(16).padStart(2,'0')).join(''),oldD,newHex:hex,newD:dist(color,target),active:recipe.length,water:best.v.water});
 if((ni+1)%25===0)console.log(ni+1,'/',officialNames.length);
}
fs.writeFileSync('OPTIMIZED-RECIPES-v10.8.51.json',JSON.stringify(optimized,null,2));
fs.writeFileSync('OPTIMIZED-RECIPES-v10.8.51-REPORT.json',JSON.stringify(report,null,2));
const summary={
 count:report.length,
 exact:report.filter(x=>x.newD===0).length,
 within2:report.filter(x=>x.newD<=2).length,
 within5:report.filter(x=>x.newD<=5).length,
 within10:report.filter(x=>x.newD<=10).length,
 mean:report.reduce((s,x)=>s+x.newD,0)/report.length,
 max:Math.max(...report.map(x=>x.newD)),
 improved:report.filter(x=>x.newD<x.oldD-1e-9).length
};
console.log(JSON.stringify(summary,null,2));
