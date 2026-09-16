import test from 'node:test';
import assert from 'node:assert/strict';
import {officialNames,mixOfficialRecipe,official,classification,rgb} from './production-mixing-utils.js';

const d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
test('v10.8.52 optimized recipes: all 350 are geometrically owned and all 350 formal-rescue recognized',()=>{
 let owned=0,strict=0,rescued=0;
 for(const name of officialNames){
   const c=mixOfficialRecipe(name,1);
   const ranked=official.map(x=>({name:x.name,d:d(c,rgb(x.hex))})).sort((a,b)=>a.d-b.d);
   if(ranked[0].name===name)owned++;
   const s=classification.nearestStrictOfficialRGB(...c);
   if(s.entry?.name===name)strict++;
   const r=s.entry?s:classification.conditionalOfficialRescueRGB(...c);
   if(r.entry?.name===name)rescued++;
 }
 assert.equal(owned,350);
 assert.equal(strict,349);
 assert.equal(rescued,350);
});
