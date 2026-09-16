
import fs from 'node:fs';
import {officialNames,reproductionRecipes,mixingEngine,canonical,classification,rgb} from './test/production-mixing-utils.js';

const pigments=['#000000','#ff0000','#00ff00','#0000ff','#00ffff','#ff00ff','#ffff00','#ffffff'];
const officialSet=new Set(officialNames);
const centers=canonical.filter(c=>officialSet.has(c.name)).map(c=>({name:c.name,rgb:rgb(c.hex)}));
const cfg={topK:4,maxRgb:30,maxRecipe:.08,minMargin:1.15,waterWeight:.65};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function normalizeWeights(w){let s=w.reduce((a,b)=>a+b,0)||1;return w.map(x=>x/s)}
function vecFromWeights(w){return Object.fromEntries(pigments.map((h,i)=>[h,w[i]]))}
function normalizeRecipe(recipe){
 const sum=recipe.reduce((s,r)=>s+r.ratio,0)||1, v=Object.fromEntries(pigments.map(h=>[h,0]));
 for(const r of recipe)v[r.hex]=(v[r.hex]||0)+r.ratio/sum; return v;
}
const recipeVec=new Map(officialNames.map(n=>[n,{v:normalizeRecipe(reproductionRecipes[n].recipe),water:reproductionRecipes[n].waterLevel}]));
function recipeDistance(sample,target){
 let l1=0;for(const h of pigments)l1+=Math.abs(sample.vec[h]-target.v[h]);
 return l1+cfg.waterWeight*Math.abs(sample.water-target.water);
}
function rgbDist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}
function mix(weights,water){
 const sources=new Map();weights.forEach((x,i)=>{if(x>1e-12)sources.set(pigments[i],x)});
 return mixingEngine.mixAggregate({total:1,sources,waterLevel:water,mixLevel:1}).map(Math.round);
}
function tiebreak(sample){
 const current=classification.conditionalOfficialRescueRGB(...sample.rgb);
 if(current.entry)return {fired:false,current:current.entry.name};
 const rgbRank=centers.map(x=>({name:x.name,d:rgbDist(sample.rgb,x.rgb)})).sort((a,b)=>a.d-b.d).slice(0,cfg.topK);
 const ranked=rgbRank.map(x=>({name:x.name,rd:recipeDistance(sample,recipeVec.get(x.name)),rgbd:x.d})).sort((a,b)=>a.rd-b.rd);
 const a=ranked[0],b=ranked[1],margin=b.rd/Math.max(a.rd,1e-9);
 return {fired:a.rgbd<=cfg.maxRgb&&a.rd<=cfg.maxRecipe&&margin>=cfg.minMargin,candidate:a.name,rd:a.rd,rgbd:a.rgbd,margin};
}
function nearestRecipe(sample){
 let best={name:null,d:Infinity},second={name:null,d:Infinity};
 for(const n of officialNames){
  const d=recipeDistance(sample,recipeVec.get(n));
  if(d<best.d){second=best;best={name:n,d}}else if(d<second.d)second={name:n,d};
 }
 return {best,second};
}
// deterministic PRNG
let state=0x51A7C0DE; function rnd(){state=(1664525*state+1013904223)>>>0;return state/4294967296}
function exp(){return -Math.log(Math.max(1e-12,1-rnd()))}
function dirichlet(alpha){
 const a=[];for(let i=0;i<8;i++){ // gamma approximation sufficient for stress generation
  if(alpha===1)a.push(exp());
  else {let x=0;const k=Math.max(1,Math.round(alpha*4));for(let j=0;j<k;j++)x+=exp();a.push(x/k);}
 }return normalizeWeights(a)
}
const buckets={farRandom:{n:0,fires:0},allRandom:{n:0,fires:0},adversarialNearBoundary:{n:0,fires:0}};
const examples=[];

// 50k free random mixes. "Far" means recipe-space > .12 from every official recipe:
// a tie-break fire there would violate its intended recipe-neighborhood semantics.
for(let i=0;i<50000;i++){
 const weights=dirichlet(i%2?1:0.5),water=rnd();
 const sample={vec:vecFromWeights(weights),water,rgb:mix(weights,water)};
 const near=nearestRecipe(sample),res=tiebreak(sample);
 buckets.allRandom.n++; if(res.fired)buckets.allRandom.fires++;
 if(near.best.d>.12){buckets.farRandom.n++;if(res.fired){buckets.farRandom.fires++;if(examples.length<10)examples.push({type:'far',near,res,rgb:sample.rgb,water})}}
}

// 20k adversarial blends halfway between pairs of official recipes, plus water interpolation.
// These deliberately live in ambiguous recipe territory and should not be rescued casually.
for(let i=0;i<20000;i++){
 const a=officialNames[Math.floor(rnd()*officialNames.length)],b=officialNames[Math.floor(rnd()*officialNames.length)];
 if(a===b){i--;continue}
 const va=recipeVec.get(a),vb=recipeVec.get(b),t=.35+.30*rnd();
 const weights=pigments.map(h=>(1-t)*va.v[h]+t*vb.v[h]);
 const water=(1-t)*va.water+t*vb.water;
 const sample={vec:vecFromWeights(weights),water,rgb:mix(weights,water)};
 const near=nearestRecipe(sample),res=tiebreak(sample);
 // Only count genuinely ambiguous recipe points: top two within 15%.
 if(near.second.d/Math.max(near.best.d,1e-9)<1.15){
  buckets.adversarialNearBoundary.n++;
  if(res.fired){buckets.adversarialNearBoundary.fires++;if(examples.length<10)examples.push({type:'boundary',a,b,near,res,rgb:sample.rgb})}
 }
}
const result={config:cfg,buckets,examples,seed:'0x51A7C0DE'};
fs.writeFileSync('OFFICIAL-RECIPE-TIEBREAK-FREE-MIX-STRESS.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
