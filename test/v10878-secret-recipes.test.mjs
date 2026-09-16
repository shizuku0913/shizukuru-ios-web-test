import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');
const recipeMatch=source.match(/const OFFICIAL_SECRET_RECIPES_V10878=Object\.freeze\((\{[\s\S]*?\})\);\nfunction officialSecretRecipe/);
const officialMatch=source.match(/const OFFICIAL_ENCYCLOPEDIA_NAMES=Object\.freeze\((\[[\s\S]*?\])\);/);

test('v10.8.78 ships a secret recipe for every official color',()=>{
  assert.ok(recipeMatch);
  assert.ok(officialMatch);
  const recipes=vm.runInNewContext('('+recipeMatch[1]+')');
  const names=vm.runInNewContext('('+officialMatch[1]+')');
  assert.equal(names.length,350);
  assert.equal(Object.keys(recipes).length,350);
  for(const name of names){
    assert.ok(recipes[name],`missing recipe: ${name}`);
    assert.ok(Array.isArray(recipes[name].parts)&&recipes[name].parts.length>=1);
    assert.ok(recipes[name].parts.every(x=>Number.isInteger(x.parts)&&x.parts>0));
    assert.ok(recipes[name].water>=0&&recipes[name].water<=1);
  }
});

test('secret recipe is discovery-detail presentation only',()=>{
  assert.match(source,/entry\?\.kind==='official'\?officialSecretRecipe\(entry\.name\):null/);
  assert.match(source,/renderOfficialSecretRecipe\(entry\);/);
  assert.match(source,/These recipes are presentation-only and do not alter mixing or recognition/);
});

test('secret recipe copy is localized in Japanese and English',()=>{
  assert.match(source,/'detail\.secret\.title':'🔐 ひみつのレシピ'/);
  assert.match(source,/'detail\.secret\.title':'🔐 Secret recipe'/);
});
