import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {mixingEngine,classification,officialNames,reproductionRecipes} from './production-mixing-utils.js';

const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');
const match=source.match(/const OFFICIAL_SECRET_RECIPES_V10878=Object\.freeze\((\{[\s\S]*?\})\);\nfunction officialSecretRecipe/);
const recipes=vm.runInNewContext('('+match[1]+')');
const baseHex={};
for(const record of Object.values(reproductionRecipes)) for(const row of record.recipe) baseHex[row.name]??=row.hex;

function displayedWaterDrops(recipe){
  return recipe.water>0?Math.min(5,Math.max(1,Math.round(recipe.water/0.18))):0;
}

function executeDisplayedRecipe(name){
  const recipe=recipes[name];
  const total=recipe.parts.reduce((sum,p)=>sum+p.parts,0);
  const sources=new Map(recipe.parts.map(p=>[baseHex[p.name],p.parts]));
  const waterDrops=displayedWaterDrops(recipe);
  const waterLevel=Math.min(1,waterDrops*0.18);
  const rgb=Array.from(mixingEngine.mixAggregate({total,sources,waterLevel,mixLevel:1}),Math.round);
  const actual=classification.nearestStrictOfficialRGB(...rgb).entry?.name??null;
  return {actual,rgb,waterDrops};
}

test('v10.11.6: all 350 displayed secret recipes strictly reproduce their intended official color',()=>{
  assert.equal(officialNames.length,350);
  assert.equal(Object.keys(recipes).length,350);
  for(const name of officialNames){
    const result=executeDisplayedRecipe(name);
    assert.equal(result.actual,name,`${name}: displayed recipe became ${result.actual??'none'} at rgb(${result.rgb.join(',')}) with water x${result.waterDrops}`);
  }
});

test('v10.11.6: washed penguin recipe is executable and strict-recognized',()=>{
  assert.equal(JSON.stringify(recipes['せんたくしたぺんぎんいろ'].parts),JSON.stringify([{name:'くろ',parts:5},{name:'しろ',parts:2}]));
  assert.equal(displayedWaterDrops(recipes['せんたくしたぺんぎんいろ']),4);
  assert.equal(executeDisplayedRecipe('せんたくしたぺんぎんいろ').actual,'せんたくしたぺんぎんいろ');
});
