import fs from 'node:fs';
import {officialNames,reproductionRecipes,mixingEngine,canonical,classification,rgb} from './test/production-mixing-utils.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pigments=['#000000','#ff0000','#00ff00','#0000ff','#00ffff','#ff00ff','#ffff00','#ffffff'];
const officialSet=new Set(officialNames);
const centers=canonical.filter(c=>officialSet.has(c.name)).map(c=>({name:c.name,rgb:rgb(c.hex)}));
function normalizeRecipe(recipe){
 const sum=recipe.reduce((s,r)=>s+r.ratio,0)||1; const v=Object.fromEntries(pigments.map(h=>[h,0]));
 for(const r of recipe)v[r.hex]=(v[r.hex]||0)+r.ratio/sum; return v;
}
const recipeVec=new Map(officialNames.map(n=>[n,{v:normalizeRecipe(reproductionRecipes[n].recipe),water:reproductionRecipes[n].waterLevel}]));
function mix(rec,recipe,water=rec.waterLevel){
 const sum=recipe.reduce((s,r)=>s+r.ratio,0)||1;
 const sources=new Map(recipe.filter(r=>r.ratio>0).map(r=>[r.hex,r.ratio/sum]));
 return {rgb:mixingEngine.mixAggregate({total:1,sources,waterLevel:clamp(water,0,1),mixLevel:1}).map(Math.round),vec:normalizeRecipe(recipe),water:clamp(water,0,1)};
}
function perturb(recipe,idx,pct){return recipe.map((r,j)=>({...r,ratio:r.ratio*(j===idx?1+pct:1)}));}
function recipeDistance(sample,target,waterWeight=0.65){
 let l1=0; for(const h of pigments)l1+=Math.abs((sample.vec[h]||0)-(target.v[h]||0));
 return l1 + waterWeight*Math.abs(sample.water-target.water);
}
function rgbDist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}
function makeCases(set,pcts,waters){
 const out=[];
 for(const owner of officialNames){
  const rec=reproductionRecipes[owner];
  for(let i=0;i<rec.recipe.length;i++)for(const pct of pcts){const m=mix(rec,perturb(rec.recipe,i,pct));out.push({set,owner,kind:`ingredient${i}:${pct}`,...m});}
  for(const dw of waters){const m=mix(rec,rec.recipe,rec.waterLevel+dw);out.push({set,owner,kind:`water:${dw}`,...m});}
 }
 return out;
}
const cases=[
 ...makeCases('practical',[-.10,.10],[-.05,.05]),
 ...makeCases('holdout',[-.075,-.05,-.025,.025,.05,.075],[-.0375,-.025,-.0125,.0125,.025,.0375])
];
// Precompute current result + RGB top5 + recipe scores within top5.
for(const c of cases){
 const prod=classification.conditionalOfficialRescueRGB(...c.rgb); c.current=prod.entry?.name??null;
 c.rgbRank=centers.map(x=>({name:x.name,d:rgbDist(c.rgb,x.rgb)})).sort((a,b)=>a.d-b.d).slice(0,5);
 c.recipeRank=c.rgbRank.map(x=>({name:x.name,rd:recipeDistance(c,recipeVec.get(x.name)),rgbd:x.d})).sort((a,b)=>a.rd-b.rd);
}
const cfgResults=[];
for(const topK of [2,3,4,5])for(const maxRgb of [8,10,12,16,20,24,30])for(const maxRecipe of [.05,.08,.10,.12,.15,.20,.25,.30,.40])for(const minMargin of [1.15,1.25,1.4,1.6,2,2.5,3]){
 let p={curC:0,curW:0,curM:0,finC:0,finW:0,finM:0,resC:0,resW:0},h={curC:0,curW:0,curM:0,finC:0,finW:0,finM:0,resC:0,resW:0};
 for(const c of cases){
  const o=c.set==='practical'?p:h; let entry=c.current;
  if(entry===c.owner)o.curC++; else if(entry===null)o.curM++; else o.curW++;
  if(entry===null){
   const rr=c.rgbRank.slice(0,topK);
   const ranked=rr.map(x=>({name:x.name,rd:recipeDistance(c,recipeVec.get(x.name)),rgbd:x.d})).sort((a,b)=>a.rd-b.rd);
   const a=ranked[0],b=ranked[1]; const margin=b.rd/Math.max(a.rd,1e-9);
   if(a.rgbd<=maxRgb && a.rd<=maxRecipe && margin>=minMargin){entry=a.name; if(entry===c.owner)o.resC++; else o.resW++;}
  }
  if(entry===c.owner)o.finC++; else if(entry===null)o.finM++; else o.finW++;
 }
 const extraWrong=(p.finW-p.curW)+(h.finW-h.curW);
 cfgResults.push({topK,maxRgb,maxRecipe,minMargin,extraWrong,practical:p,holdout:h,totalRescue:p.resC+h.resC});
}
const safe=cfgResults.filter(x=>x.extraWrong===0).sort((a,b)=>b.totalRescue-a.totalRescue || b.practical.resC-a.practical.resC);
const best=safe[0]||null;
const result={caseCounts:{practical:cases.filter(x=>x.set==='practical').length,holdout:cases.filter(x=>x.set==='holdout').length},bestSafe:best,topSafe:safe.slice(0,20)};
fs.writeFileSync('/mnt/data/shizukuru_recipe_tiebreak_simulation.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
