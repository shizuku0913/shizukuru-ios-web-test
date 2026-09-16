import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');

test('v10.8.79 keeps developer note out of renderable head text',()=>{
  const firstStyle=source.indexOf('<style>');
  assert.ok(firstStyle>0);
  const beforeStyle=source.slice(0,firstStyle);
  assert.doesNotMatch(beforeStyle,/\/\*\s*v10\.8\.78 Official Secret Recipes/);
  assert.match(source,/<!-- v10\.8\.79:/);
});

test('v10.8.79 preserves secret recipes and their CSS',()=>{
  assert.match(source,/OFFICIAL_SECRET_RECIPES_V10878/);
  assert.match(source,/renderOfficialSecretRecipe\(entry\);/);
  assert.match(source,/\/\* v10\.8\.78 Official Secret Recipes[\s\S]*?\.detail-secret-recipe/);
});
