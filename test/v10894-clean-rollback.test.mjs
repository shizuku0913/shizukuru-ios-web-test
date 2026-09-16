import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');

test('v10.8.94 is based on the stable pre-multilingual runtime',()=>{
  for(const token of [
    'v10892-i18n-recovery',
    'v10893-language-runtime',
    'languagePickerOverlay',
    'EXPLICIT_TRANSLATION_KEYS',
    'translationAudit'
  ]) assert.ok(!source.includes(token),token);
});

test('v10.8.94 preserves the completion official-color fix',()=>{
  assert.match(source,/mixProgress=1;\s*SourcePaintModel\.syncTarget\(\)/);
  assert.match(source,/ColorClassification\.completedWithRecipe/);
});

test('v10.8.94 preserves secret recipes and uses water count display',()=>{
  assert.match(source,/OFFICIAL_SECRET_RECIPES_V10878/);
  assert.match(source,/WATER_PER_DROP_DISPLAY=0\.18/);
  assert.match(source,/💧 水 ×\$\{waterCount\}/);
  assert.doesNotMatch(source,/const pct=Math\.round\(recipe\.water\*100\)/);
});
