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
function variants(record){
  const out=[];
  for(let i=0;i<record.recipe.length;i++) for(const pct of [-0.10,0.10]){
    const recipe=record.recipe.map((r,j)=>({...r,ratio:r.ratio*(j===i?1+pct:1)}));
    out.push({label:`${record.recipe[i].name} ${pct>0?'+':''}${Math.round(pct*100)}%`,recipe,water:record.waterLevel});
  }
  for(const delta of [-0.05,0.05]) out.push({label:`water ${delta>0?'+':''}${delta.toFixed(2)}`,recipe:record.recipe,water:record.waterLevel+delta});
  return out;
}

// Keep hue/chroma/DeltaE safeguards unchanged. Only allow a small additive RGB-radius slack.
function nonDistanceGuardsPass(p){
  if(!p)return false;
  const target=p.target,candidate=p.candidate;
  if(p.deltaE>5.5)return false;
  if(target.chroma<=8.0 && candidate.chroma>12.0)return false;
  if(target.chroma>12.0 && candidate.chroma<8.0)return false;
  if(p.chromaDelta>16.0)return false;
  if(target.chroma>8.0 && candidate.chroma>8.0){
    const maxC=Math.max(candidate.chroma,target.chroma);
    const hueLimit=maxC>=50?10:maxC>=30?14:18;
    if(p.hueDelta>hueLimit)return false;
  }
  return true;
}
function currentDecision(rgb){
  return classification.nearestStrictOfficialRGB(...rgb).entry?.name??null;
}
function rescueDecision(rgb,slack){
  const nearest=classification.nearestOfficialEncyclopediaRGB(...rgb);
  if(!nearest.entry)return null;
  const strict=classification.nearestStrictOfficialRGB(...rgb);
  if(strict.entry)return strict.entry.name;
  const p=nearest.perception;
  const adaptiveRadius=Number(strict.perception?.adaptiveRadius ?? 0);
  const allowed=Math.min(7.5+slack,adaptiveRadius+slack);
  if(nonDistanceGuardsPass(p) && p.rgbDistance<=allowed)return nearest.entry.name;
  return null;
}

test('audit: safe rescue slack for practical official-color misses',()=>{
  const samples=[];
  for(const expected of officialNames){
    const record=reproductionRecipes[expected];
    for(const v of variants(record)){
      const rgb=mix(record,v.recipe,v.water);
      samples.push({expected,label:v.label,rgb,current:currentDecision(rgb)});
    }
  }
  const slacks=[0,0.25,0.5,0.75,1.0,1.25,1.5,2.0];
  const scenarios=slacks.map(slack=>{
    let correct=0,wrong=0,none=0,rescued=0,newWrong=0;
    const wrongExamples=[];
    for(const s of samples){
      const actual=slack===0?s.current:rescueDecision(s.rgb,slack);
      if(actual===s.expected){correct++; if(s.current!==s.expected)rescued++;}
      else if(actual==null)none++;
      else {wrong++; if(s.current==null)newWrong++; if(wrongExamples.length<20)wrongExamples.push({...s,actual});}
    }
    return {slack,total:samples.length,correct,successRate:correct/samples.length,none,wrong,rescued,newWrong,wrongExamples};
  });
  const baseline=scenarios[0];
  const safe=scenarios.filter(s=>s.newWrong===0).sort((a,b)=>b.correct-a.correct)[0];
  const report={version:'10.8.52-official-practical-rescue-audit',baseline,scenarios,safestBest:safe};
  fs.writeFileSync('OFFICIAL-PRACTICAL-RESCUE-AUDIT.json',JSON.stringify(report,null,2));
  const md=['# Shizukuru Practical Discovery Rescue Audit — v10.8.52','',
    'No production recognition thresholds are changed in this build.',
    'Simulation keeps DeltaE/hue/chroma guards unchanged and adds only small RGB-radius slack after nearest-official selection.','',
    '| Slack | Correct | Success | None | Wrong | Rescued | New wrong |','|---:|---:|---:|---:|---:|---:|---:|',
    ...scenarios.map(s=>`| +${s.slack.toFixed(2)} | ${s.correct}/${s.total} | ${(100*s.successRate).toFixed(2)}% | ${s.none} | ${s.wrong} | ${s.rescued} | ${s.newWrong} |`),'',
    `Best zero-new-wrong scenario: +${safe.slack.toFixed(2)} RGB units → ${(100*safe.successRate).toFixed(2)}% (${safe.correct}/${safe.total}), rescued ${safe.rescued}.`];
  fs.writeFileSync('OFFICIAL-PRACTICAL-RESCUE-AUDIT.md',md.join('\n'));
  assert.equal(samples.length,4410);
  assert.ok(safe.correct>=baseline.correct);
});
