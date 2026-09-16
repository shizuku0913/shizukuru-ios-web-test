
import {reproductionRecipes,mixingEngine,classification,official,rgb} from './test/production-mixing-utils.js';

function mix(name){
  const rec=reproductionRecipes[name];
  const sum=rec.recipe.reduce((s,r)=>s+r.ratio,0);
  const sources=new Map(rec.recipe.map(r=>[r.hex,r.ratio/sum]));
  const color=mixingEngine.mixAggregate({total:1,sources,waterLevel:rec.waterLevel,mixLevel:1}).map(Math.round);
  const strict=classification.nearestStrictOfficialRGB(...color);
  const rescue=classification.conditionalOfficialRescueRGB(...color);
  const target=official.find(x=>x.name===name);
  return {name,rec,color,target:target.hex,strict:strict.entry?.name??null,rescue:rescue.entry?.name??null,
    strictPerception:strict.perception,rescuePerception:rescue.perception};
}
console.log(JSON.stringify([mix('オレンジ'),mix('あたらしいしゃぼんだまいろ')],null,2));
