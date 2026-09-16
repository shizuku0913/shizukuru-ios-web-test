import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const s=fs.readFileSync('app/src/main/assets/www/index.html','utf8');

test('v10.8.49 recipe tie-break is a third-stage production rescue using immutable completion recipe/water',()=>{
  for(const token of [
    'officialRecipeTieBreak(rr,gg,bb,recipeRows,waterLevel)',
    'completedWithRecipe(rr,gg,bb,hex,recipeRows,waterLevel)',
    "slice(0,4)",
    "first.rgbd>30||first.rd>.08||margin<1.15",
    "l1+.65*Math.abs",
    "mixed.recipe,mixed.waterLevel"
  ]) assert.ok(s.includes(token),token);
  const lifecycle=s.slice(s.indexOf('const CompletionDiscoveryLifecycle'),s.indexOf('const CompletionDiscoveryLifecycle')+1700);
  assert.equal((lifecycle.match(/completedWithRecipe\(/g)||[]).length,2);
  assert.ok(!lifecycle.includes('ColorClassification.completed(rr,gg,bb,hex)'));
});
