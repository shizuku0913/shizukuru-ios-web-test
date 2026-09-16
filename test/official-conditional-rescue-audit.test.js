import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { officialNames,reproductionRecipes,mixingEngine,classification,official,rgb } from './production-mixing-utils.js';

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
const centers=official.map(entry=>({entry,rgb:rgb(entry.hex)}));
function ownership(rgbValue){
  const sorted=centers.map(({entry,rgb:target})=>{
    const d=Math.hypot(rgbValue[0]-target[0],rgbValue[1]-target[1],rgbValue[2]-target[2]);
    return {entry,d};
  }).sort((a,b)=>a.d-b.d);
  return {first:sorted[0],second:sorted[1],ratio:sorted[1].d/Math.max(sorted[0].d,1e-9),margin:sorted[1].d-sorted[0].d};
}
function conditionalRescue(rgbValue,{slack=1.25,minOwnershipRatio=2.0}={}){
  const strict=classification.nearestStrictOfficialRGB(...rgbValue);
  if(strict.entry)return strict.entry.name;
  const nearest=classification.nearestOfficialEncyclopediaRGB(...rgbValue);
  if(!nearest.entry)return null;
  const own=ownership(rgbValue);
  if(own.first.entry.name!==nearest.entry.name)return null;
  if(own.ratio<minOwnershipRatio)return null;
  const adaptiveRadius=Number(strict.perception?.adaptiveRadius??0);
  const allowed=Math.min(7.5+slack,adaptiveRadius+slack);
  if(!nonDistanceGuardsPass(nearest.perception))return null;
  if(nearest.perception.rgbDistance>allowed)return null;
  return nearest.entry.name;
}

test('audit: v10.8.52 production engine exposes optimized-recipe tolerance baseline',()=>{
  const samples=[];
  for(const expected of officialNames){
    const record=reproductionRecipes[expected];
    for(const v of variants(record)){
      const mixed=mix(record,v.recipe,v.water);
      const current=classification.nearestStrictOfficialRGB(...mixed).entry?.name??null;
      const rescued=conditionalRescue(mixed);
      samples.push({expected,label:v.label,rgb:mixed,current,rescued});
    }
  }
  const baseline={correct:0,none:0,wrong:0};
  const candidate={correct:0,none:0,wrong:0,rescued:0,newWrong:0};
  const rescuedExamples=[];
  for(const s of samples){
    if(s.current===s.expected)baseline.correct++;
    else if(s.current==null)baseline.none++;
    else baseline.wrong++;
    if(s.rescued===s.expected){candidate.correct++; if(s.current!==s.expected){candidate.rescued++; if(rescuedExamples.length<40)rescuedExamples.push(s);}}
    else if(s.rescued==null)candidate.none++;
    else {candidate.wrong++; if(s.current==null)candidate.newWrong++;}
  }
  const report={
    version:'10.8.50-production-engine-conditional-rescue-characterization',
    productionChanged:false,engine:'ryb-pigment-strength-dulling-touchtest-v1',
    rule:{rgbSlack:1.25,minOwnershipRatio:2.0,description:'Only rescue a current null when the nearest official is at least twice as close as the second nearest, all existing hue/chroma/DeltaE guards pass, and distance is within adaptive radius + 1.25.'},
    total:samples.length,
    baseline:{...baseline,successRate:baseline.correct/samples.length},
    candidate:{...candidate,successRate:candidate.correct/samples.length},
    rescuedExamples
  };
  fs.writeFileSync('OFFICIAL-CONDITIONAL-RESCUE-AUDIT.json',JSON.stringify(report,null,2));
  fs.writeFileSync('OFFICIAL-CONDITIONAL-RESCUE-AUDIT.md',[
    '# Shizukuru Conditional Official-Color Rescue Audit — v10.8.41','',
    '**Production recognition is unchanged in this build.**','',
    'Candidate rescue rule:',
    '- Current strict result must be null.',
    '- Existing DeltaE / hue / chroma safeguards must all pass.',
    '- Nearest official color must be at least **2.0× closer** than the second-nearest official color.',
    '- RGB distance may extend only **+1.25** beyond the current adaptive radius (still capped by DISCOVER_DISTANCE + slack).','',
    `Baseline: ${baseline.correct}/${samples.length} (${(100*baseline.correct/samples.length).toFixed(2)}%), none ${baseline.none}, wrong ${baseline.wrong}.`,
    `Candidate: ${candidate.correct}/${samples.length} (${(100*candidate.correct/samples.length).toFixed(2)}%), none ${candidate.none}, wrong ${candidate.wrong}.`,
    `Rescued: ${candidate.rescued}; new wrong discoveries: ${candidate.newWrong}.`,'',
    'This rule is a candidate for production only after this audit passes alongside all existing regression tests.'
  ].join('\n'));
  assert.equal(samples.length,4410);
  assert.equal(baseline.correct,3583);
  assert.equal(baseline.none,760);
  assert.equal(baseline.wrong,67);
  assert.equal(candidate.newWrong,1);
  assert.equal(candidate.rescued,148);
  assert.equal(candidate.correct,3731);
});
