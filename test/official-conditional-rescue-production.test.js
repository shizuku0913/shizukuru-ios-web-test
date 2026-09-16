import test from 'node:test';
import assert from 'node:assert/strict';
import { officialNames,reproductionRecipes,mixingEngine,classification } from './production-mixing-utils.js';
import { source } from './source-utils.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function mix(record, recipe, waterLevel=record.waterLevel){
  const sum=recipe.reduce((s,r)=>s+r.ratio,0);
  const sources=new Map(recipe.filter(r=>r.ratio>0).map(r=>[r.hex,r.ratio/sum]));
  return mixingEngine.mixAggregate({total:1,sources,waterLevel:clamp(waterLevel,0,1),mixLevel:1}).map(Math.round);
}
function variants(record){
  const out=[];
  for(let i=0;i<record.recipe.length;i++)for(const pct of [-.10,.10]){
    const recipe=record.recipe.map((r,j)=>({...r,ratio:r.ratio*(j===i?1+pct:1)}));
    out.push({recipe,water:record.waterLevel});
  }
  for(const delta of [-.05,.05])out.push({recipe:record.recipe,water:record.waterLevel+delta});
  return out;
}

test('production conditional rescue is characterized against the actual v10.8.52 engine',()=>{
  let total=0,baselineCorrect=0,baselineNone=0,baselineWrong=0;
  let rescuedCorrect=0,rescuedNone=0,rescuedWrong=0,rescuedCount=0,newWrong=0;
  for(const expected of officialNames){
    const record=reproductionRecipes[expected];
    for(const v of variants(record)){
      total++;
      const color=mix(record,v.recipe,v.water);
      const strict=classification.nearestStrictOfficialRGB(...color).entry?.name??null;
      const rescue=classification.conditionalOfficialRescueRGB(...color).entry?.name??null;
      if(strict===expected)baselineCorrect++; else if(strict==null)baselineNone++; else baselineWrong++;
      const finalName=strict??rescue;
      if(finalName===expected){rescuedCorrect++; if(strict==null)rescuedCount++;}
      else if(finalName==null)rescuedNone++;
      else {rescuedWrong++; if(strict==null)newWrong++;}
    }
  }
  assert.equal(total,4410);
  assert.deepEqual({baselineCorrect,baselineNone,baselineWrong},{baselineCorrect:3583,baselineNone:760,baselineWrong:67});
  assert.equal(rescuedCount,148);
  assert.equal(rescuedCorrect,3731);
  assert.equal(rescuedNone,611);
  assert.equal(rescuedWrong,68);
  assert.equal(newWrong,1);
});

test('production completion path calls conditional rescue only after strict null',()=>{
  const completed=source.slice(source.indexOf('completed(rr,gg,bb,hex){'),source.indexOf('};\nfunction colorDistanceHex',source.indexOf('completed(rr,gg,bb,hex){')));
  assert.match(completed,/nearestStrictOfficialRGB/);
  assert.match(completed,/if\(strictOfficial\.entry\)/);
  assert.match(completed,/conditionalOfficialRescueRGB/);
});
