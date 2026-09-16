import test from 'node:test';
import assert from 'node:assert/strict';
import {source} from './source-utils.js';

test('v10.8.27 touch-test engine activates approved pigment experiment',()=>{
  assert.match(source,/RYB_PIGMENT:'ryb-pigment'/);
  assert.match(source,/const startupMode=MixingEngineMode\.RYB_PIGMENT/);
  assert.match(source,/id:'ryb-pigment-strength-dulling-touchtest-v1'/);
});

test('dulling starts at approved 0.52 and only after 3 chromatic sources',()=>{
  const a=source.indexOf('const RYBHueSpreadDullingProfile=');
  const b=source.indexOf('const RYBPigmentTouchTestEngine=',a);
  const block=source.slice(a,b);
  assert.match(block,/onset:\.52/);
  assert.match(block,/finalStrength:\.84/);
  assert.match(block,/if\(chromatic\.length<3\)return 0/);
});

test('two-colour touch-test skips multi-hue dulling while allowing CMY bridge and calibrated undertone',()=>{
  const a=source.indexOf('const RYBPigmentTouchTestEngine=');
  const b=source.indexOf('// v10.8.25:',a);
  const block=source.slice(a,b);
  assert.match(block,/mixPair\(a,b,t=\.5\)/);
  assert.match(block,/RYBPigmentStrengthProfile\.shapePair/);
  const pairBlock=block.slice(block.indexOf('mixPair'));
  assert.doesNotMatch(pairBlock,/RYBHueSpreadDullingProfile\.apply/);
  assert.match(pairBlock,/RYBCMYSubtractiveBridgeProfile\.apply/);
});
