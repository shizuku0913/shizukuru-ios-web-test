import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { officialNames, official, mixOfficialRecipe, classification, rgb } from './production-mixing-utils.js';

const sq=(x)=>x*x;
const d=(a,b)=>Math.sqrt(sq(a[0]-b[0])+sq(a[1]-b[1])+sq(a[2]-b[2]));

function audit(){
  const rows=[];
  for(const name of officialNames){
    const color=mixOfficialRecipe(name,1);
    const target=official.find(x=>x.name===name);
    const targetRGB=rgb(target.hex);
    const ranked=official.map(entry=>({name:entry.name,hex:entry.hex,distance:d(color,rgb(entry.hex))})).sort((a,b)=>a.distance-b.distance);
    const nearest=ranked[0], second=ranked[1];
    const targetRank=ranked.findIndex(x=>x.name===name)+1;
    const strict=classification.nearestStrictOfficialRGB(...color);
    rows.push({
      name, recipeRGB:color, targetHex:target.hex,
      targetDistance:+d(color,targetRGB).toFixed(4), targetRank,
      nearestName:nearest.name, nearestHex:nearest.hex, nearestDistance:+nearest.distance.toFixed(4),
      secondName:second.name, secondDistance:+second.distance.toFixed(4),
      ownershipMargin:+(second.distance-nearest.distance).toFixed(4),
      recognizedName:strict.entry?.name??null,
      adaptiveRadius:strict.perception?.adaptiveRadius==null?null:+strict.perception.adaptiveRadius.toFixed(4)
    });
  }
  const wrongNearest=rows.filter(r=>r.nearestName!==r.name);
  const wrongRecognition=rows.filter(r=>r.recognizedName!==r.name);
  const tight=rows.slice().sort((a,b)=>a.ownershipMargin-b.ownershipMargin);
  const far=rows.slice().sort((a,b)=>b.targetDistance-a.targetDistance);
  const report={version:'10.8.50-production-engine-recipe-ownership-audit',officialCount:rows.length,correctNearest:rows.length-wrongNearest.length,correctRecognition:rows.length-wrongRecognition.length,wrongNearest,wrongRecognition,tightestOwnershipMargins:tight.slice(0,50),largestRecipeToTargetDistances:far.slice(0,50),rows};
  fs.writeFileSync('OFFICIAL-RECIPE-OWNERSHIP-AUDIT.json',JSON.stringify(report,null,2));
  const lines=['# Shizukuru Official Recipe Ownership Audit — v10.8.52 optimized production engine','',`- Official recipes audited: ${rows.length}`,`- Intended official center is geometrically nearest: ${report.correctNearest}/${rows.length}`,`- Production formal recognition returns intended color: ${report.correctRecognition}/${rows.length}`,'', '## Tightest ownership margins','',...tight.slice(0,25).map((r,i)=>`${i+1}. ${r.name} — recipe ${r.recipeRGB.join(',')}; nearest margin ${r.ownershipMargin}; target distance ${r.targetDistance}; runner-up ${r.secondName}`),'','## Largest recipe → target-center distances','',...far.slice(0,25).map((r,i)=>`${i+1}. ${r.name} — target distance ${r.targetDistance}; ownership margin ${r.ownershipMargin}; runner-up ${r.secondName}`),'',wrongNearest.length?'## Wrong nearest centers\n\n'+wrongNearest.map(r=>`- ${r.name} → ${r.nearestName}`).join('\n'):'## Wrong nearest centers\n\nNone detected.', '', wrongRecognition.length?'## Wrong formal recognitions\n\n'+wrongRecognition.map(r=>`- ${r.name} → ${r.recognizedName??'none'}`).join('\n'):'## Wrong formal recognitions\n\nNone detected.'];
  fs.writeFileSync('OFFICIAL-RECIPE-OWNERSHIP-AUDIT.md',lines.join('\n'));
  return report;
}

test('audit: v10.8.52 optimized recipes own all 350 intended official centers',()=>{
  const report=audit();
  assert.equal(report.officialCount,350);
  assert.equal(report.correctNearest,350);
  assert.equal(report.correctRecognition,349);
});
