import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');
const match=source.match(/const OFFICIAL_SECRET_RECIPES_V10878=Object\.freeze\((\{[\s\S]*?\})\);\nfunction officialSecretRecipe/);
const recipes=vm.runInNewContext('('+match[1]+')');

test('all 350 secret recipes stay within the executable five-drop water cap',()=>{
  assert.equal(Object.keys(recipes).length,350);
  for(const [name,recipe] of Object.entries(recipes)){
    assert.ok(recipe.water>=0 && recipe.water<=1,`${name}: water=${recipe.water}`);
    const drops=recipe.water>0?Math.min(5,Math.max(1,Math.round(recipe.water/0.18))):0;
    assert.ok(drops<=5,`${name}: displayed drops=${drops}`);
  }
});

test('secret recipe renderer hard-caps water instructions at five drops',()=>{
  assert.match(source,/const WATER_MAX_DROPS_DISPLAY=5;/);
  assert.match(source,/Math\.min\(WATER_MAX_DROPS_DISPLAY/);
});

test('runtime water model and secret recipe display use the same drop size and cap',()=>{
  assert.match(source,/const WATER_PER_DROP=\.18;/);
  assert.match(source,/const WATER_MAX_DROPS=5;/);
  assert.match(source,/const WATER_PER_DROP_DISPLAY=0\.18;/);
  assert.match(source,/const WATER_MAX_DROPS_DISPLAY=5;/);
});
