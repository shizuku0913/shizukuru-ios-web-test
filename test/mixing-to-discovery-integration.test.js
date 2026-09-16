import test from 'node:test';
import assert from 'node:assert/strict';
import { mixingEngine, officialNames, reproductionRecipes, classifyOfficialRecipe } from './production-mixing-utils.js';


// Representative colors intentionally span basic, green, purple/pink, food and matcha families.
const REPRESENTATIVE_STABLE_RECIPES = Object.freeze([
  'あか','みどり','あお','むらさき','ピンク','しろ','くろ',
  'ちくわいろ','まっちゃいろ','ちょこをいれたまっちゃいろ','ミルクをいれたまっちゃいろ','クリームをいれたカレーいろ'
]);

test('integration: production RYB mixing engine is loaded directly from index.html', () => {
  assert.equal(mixingEngine.id, 'ryb-pigment-strength-dulling-touchtest-v1');
  assert.equal(mixingEngine.ready, true);
});

test('integration: optimized production recipes resolve representative stale cases', () => {
  const red=classifyOfficialRecipe('あか',1);
  const purple=classifyOfficialRecipe('むらさき',1);
  const green=classifyOfficialRecipe('みどり',1);
  const black=classifyOfficialRecipe('くろ',1);
  assert.equal(red.actualName,'あか');
  assert.equal(purple.actualName,'むらさき');
  assert.equal(green.actualName,'みどり');
  assert.equal(black.actualName,'くろ');
});

test('characterization: v10.8.52 optimized production-engine recipes are 349/350 strict-recognized', () => {
  assert.equal(officialNames.length,350);
  assert.equal(Object.keys(reproductionRecipes).length,350);
  let passed=0;
  for(const name of officialNames){ if(classifyOfficialRecipe(name,1).actualName===name)passed++; }
  assert.equal(passed,349);
});
