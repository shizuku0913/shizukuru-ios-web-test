import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { officialNames, reproductionRecipes, mixingEngine, classification } from './production-mixing-utils.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function mix(record, recipe, waterLevel=record.waterLevel){
  const sum=recipe.reduce((s,r)=>s+r.ratio,0);
  const sources=new Map(recipe.filter(r=>r.ratio>0).map(r=>[r.hex,r.ratio/sum]));
  return mixingEngine.mixAggregate({total:1,sources,waterLevel:clamp(waterLevel,0,1),mixLevel:1}).map(Math.round);
}
function recognize(rgb){ return classification.nearestStrictOfficialRGB(...rgb).entry?.name??null; }
function variants(record){
  const out=[{kind:'baseline',label:'baseline',recipe:record.recipe,water:record.waterLevel}];
  for(let i=0;i<record.recipe.length;i++) for(const pct of [-0.10,0.10]){
    const recipe=record.recipe.map((r,j)=>({...r,ratio:r.ratio*(j===i?1+pct:1)}));
    out.push({kind:'ingredient',label:`${record.recipe[i].name} ${pct>0?'+':''}${Math.round(pct*100)}%`,recipe,water:record.waterLevel});
  }
  for(const delta of [-0.05,0.05]) out.push({kind:'water',label:`water ${delta>0?'+':''}${delta.toFixed(2)}`,recipe:record.recipe,water:record.waterLevel+delta});
  return out;
}

test('audit: practical official recipe tolerance at plus-minus 10 percent and water plus-minus 0.05',()=>{
  const rows=[];
  for(const name of officialNames){
    const record=reproductionRecipes[name];
    const vs=variants(record).map(v=>{const color=mix(record,v.recipe,v.water); const actual=recognize(color); return {...v,color,actual,ok:actual===name};});
    const pert=vs.filter(v=>v.kind!=='baseline');
    rows.push({name,total:pert.length,pass:pert.filter(v=>v.ok).length,rate:pert.filter(v=>v.ok).length/pert.length,failures:pert.filter(v=>!v.ok).map(v=>({label:v.label,rgb:v.color,actual:v.actual}))});
  }
  const sorted=rows.slice().sort((a,b)=>a.rate-b.rate||b.failures.length-a.failures.length);
  const all=rows.reduce((s,r)=>s+r.total,0), pass=rows.reduce((s,r)=>s+r.pass,0);
  const report={version:'10.8.39-official-recipe-practical-tolerance-audit',officialCount:rows.length,totalPerturbations:all,successfulPerturbations:pass,successRate:pass/all,fragileColors:rows.filter(r=>r.rate<1).length,worst:sorted.slice(0,50),rows};
  fs.writeFileSync('OFFICIAL-RECIPE-PRACTICAL-TOLERANCE-AUDIT.json',JSON.stringify(report,null,2));
  const md=['# Shizukuru Official Recipe Practical Tolerance Audit — v10.8.39','',`- Official colors: ${rows.length}`,`- Perturbations: ${all}`,`- Intended color retained: ${pass}/${all} (${(100*pass/all).toFixed(2)}%)`,`- Colors with at least one boundary crossing: ${report.fragileColors}`,'','## Lowest robustness', '',...sorted.slice(0,30).map((r,i)=>`${i+1}. ${r.name} — ${(100*r.rate).toFixed(1)}% (${r.pass}/${r.total}); ${r.failures.slice(0,4).map(f=>`${f.label}→${f.actual??'none'}`).join(', ')}`)];
  fs.writeFileSync('OFFICIAL-RECIPE-PRACTICAL-TOLERANCE-AUDIT.md',md.join('\n'));
  assert.equal(rows.length,350);
  assert.ok(pass>0);
});
