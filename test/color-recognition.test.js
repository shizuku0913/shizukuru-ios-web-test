import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { source, extractFunction, extractLiteralBetween, evaluateExpression } from './source-utils.js';

const gateSource = extractFunction('existingRecipeMatchesCompletedColor');

function makeGate({ officialPass = false, distance = 999, published = { name: 'あか', hex: '#ff0000' } } = {}) {
  const context = {
    OFFICIAL_ENCYCLOPEDIA_BY_NAME: new Map(published ? [['あか', published]] : []),
    normalizeOfficialEncyclopediaName: name => name,
    rgb: hex => {
      const h = hex.replace('#', '');
      return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
    },
    AdaptiveOfficialDiscovery: { evaluate: () => ({ pass: officialPass }) },
    ColorClassification: { distanceHex: () => distance },
    MY_CONFIRM_DISTANCE: 8
  };
  vm.createContext(context);
  vm.runInContext(`${gateSource}; globalThis.gate = existingRecipeMatchesCompletedColor;`, context);
  return context.gate;
}

test('v10.8.14: same personal recipe is accepted only when current completed color is close', () => {
  const match = { kind: 'provisional', entry: { hex: '#336699' } };
  assert.equal(makeGate({ distance: 3 })(match, '#34679a'), true);
  assert.equal(makeGate({ distance: 25 })(match, '#aa6699'), false);
});

test('v10.8.14: confirmed personal repeat also requires current color match', () => {
  const match = { kind: 'my', entry: { hex: '#111111', reproducedHex: '#222222' } };
  assert.equal(makeGate({ distance: 7.99 })(match, '#232323'), true);
  assert.equal(makeGate({ distance: 8.01 })(match, '#888888'), false);
});

test('v10.8.14: official repeat must pass AdaptiveOfficialDiscovery gate', () => {
  const match = { kind: 'official', entry: { name: 'あか' } };
  assert.equal(makeGate({ officialPass: true })(match, '#ff0000'), true);
  assert.equal(makeGate({ officialPass: false })(match, '#00ff00'), false);
});

test('v10.8.14: missing entry / missing published official can never match', () => {
  assert.equal(makeGate()({ kind: 'my', entry: null }, '#123456'), false);
  assert.equal(makeGate({ published: null })({ kind: 'official', entry: { name: 'あか' } }, '#ff0000'), false);
});

test('regression wiring: both completion commit and direct provisional path call the current-color gate', () => {
  const calls = source.match(/existingRecipeMatchesCompletedColor\s*\(/g) ?? [];
  // definition + commit + startProvisionalDiscovery
  assert.ok(calls.length >= 3, `expected at least 3 references, found ${calls.length}`);
  assert.match(source, /const sameCompletedColor=existingRecipeMatchesCompletedColor\(existingRecipe,hex\)/);
  assert.match(source, /sameRecipe&&existingRecipeMatchesCompletedColor\(sameRecipe,hex\)/);
});

test('official encyclopedia truth set remains exactly 350 unique names', () => {
  const expression = extractLiteralBetween('const OFFICIAL_ENCYCLOPEDIA_NAMES=Object.freeze(', ');');
  const names = evaluateExpression(expression);
  assert.equal(names.length, 350);
  assert.equal(new Set(names).size, 350);
  for (const required of ['あか', 'みどり', 'たまごやきいろ', 'ちくわいろ', 'まっちゃいろ']) {
    assert.ok(names.includes(required), `missing official color: ${required}`);
  }
});
