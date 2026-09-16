import fs from 'node:fs';
import {officialNames,reproductionRecipes,mixingEngine,canonical,classification,rgb} from './test/production-mixing-utils.js';
const officialSet=new Set(officialNames);
const centers=canonical.filter(c=>officialSet.has(c.name)).map(c=>({name:c.name,hex:c.hex,rgb:rgb(c.hex)}));
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
function mixRecord(rec, water=rec.waterLevel){
 const sources=new Map(rec.recipe.map(r=>[r.hex,r.ratio]));
 return mixingEngine.mixAggregate({total:1,sources,waterLevel:water,mixLevel:1}).map(Math.round);
}
let rows=[];
for(const name of officialNames){
 const rec=reproductionRecipes[name];
 const color=mixRecord(rec);
 const target=centers.find(c=>c.name===name);
 const ranks=centers.map(c=>({name:c.name,d:dist(color,c.rgb)})).sort((a,b)=>a.d-b.d);
 const strict=classification.nearestStrictOfficialRGB(...color);
 const rescue=classification.conditionalOfficialRescueRGB(...color);
 rows.push({name,targetHex:target.hex,color,hex:'#'+color.map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase(),targetDistance:dist(color,target.rgb),nearest:ranks[0].name,nearestDistance:ranks[0].d,runnerUp:ranks[1].name,runnerUpDistance:ranks[1].d,nearestOwned:ranks[0].name===name,strict:strict.entry?.name??null,rescue:(strict.entry?.name??rescue.entry?.name??null),water:rec.waterLevel,ingredients:rec.recipe.length});
}
const summary={count:rows.length,nearestOwned:rows.filter(r=>r.nearestOwned).length,strictCorrect:rows.filter(r=>r.strict===r.name).length,strictWrong:rows.filter(r=>r.strict&&r.strict!==r.name).length,rescueCorrect:rows.filter(r=>r.rescue===r.name).length,rescueWrong:rows.filter(r=>r.rescue&&r.rescue!==r.name).length,unrecognizedAfterRescue:rows.filter(r=>!r.rescue).length,meanTargetDistance:rows.reduce((s,r)=>s+r.targetDistance,0)/rows.length,maxTargetDistance:Math.max(...rows.map(r=>r.targetDistance))};
rows.sort((a,b)=>b.targetDistance-a.targetDistance);
fs.writeFileSync('PRODUCTION-ENGINE-350-AUDIT.json',JSON.stringify({summary,rows},null,2));
console.log(JSON.stringify(summary,null,2));
console.log(rows.slice(0,20).map(r=>`${r.name}\t${r.hex}\ttargetD=${r.targetDistance.toFixed(2)}\tnearest=${r.nearest}`).join('\n'));
