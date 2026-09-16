import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mixingEngine, officialNames, reproductionRecipes, classification } from './production-mixing-utils.js';
const pigments=['#000000','#ff0000','#00ff00','#0000ff','#00ffff','#ff00ff','#ffff00','#ffffff'];
const optimized=JSON.parse(fs.readFileSync(new URL('./fixtures/waterless-optimized68-v10814.json', import.meta.url),'utf8'));
const optMap=new Map(optimized.map(x=>[x.name,x.weights]));
function recipeWeights(rec){const m=new Map(rec.recipe.map(x=>[x.hex,x.ratio]));const v=pigments.map(h=>m.get(h)||0);const s=v.reduce((a,b)=>a+b,0);return v.map(x=>x/s)}
function classifyWaterless(weights){const sources=new Map();weights.forEach((w,i)=>{if(w>1e-8)sources.set(pigments[i],w)});const color=mixingEngine.mixAggregate({total:1,sources,waterLevel:0,mixLevel:1}).map(Math.round);const result=classification.nearestStrictOfficialRGB(...color);return {color,name:result.entry?.name??null}}
test('waterless characterization: waterless characterization after v10.8.52 recipe optimization',()=>{
 let correct=0,wrong=0,none=0;
 for(const name of officialNames){
   const weights=optMap.get(name)||recipeWeights(reproductionRecipes[name]);
   const got=classifyWaterless(weights);
   if(got.name===name)correct++; else if(got.name==null)none++; else wrong++;
 }
 assert.deepEqual({correct,wrong,none},{correct:257,wrong:2,none:91});
});
