import test from 'node:test';
import assert from 'node:assert/strict';
import {source} from './source-utils.js';

test('red-cyan has a calibrated muted violet-gray undertone',()=>{
  assert.match(source,/'#00ffff\|#ff0000':Object\.freeze\(\{anchor:Object\.freeze\(\[125,112,120\]\),maxBlend:\.74\}\)/);
});

test('red-green calibration and CMY bridge remain intact',()=>{
  assert.match(source,/'#00ff00\|#ff0000':Object\.freeze\(\{anchor:Object\.freeze\(\[119,101,84\]\),maxBlend:\.72\}\)/);
  assert.match(source,/const RYBCMYSubtractiveBridgeProfile=Object\.freeze\(/);
  assert.match(source,/maxBlend:\.68/);
});

test('approved pigment strengths and 0.52 dulling remain unchanged',()=>{
  assert.match(source,/onset:\.52/);
  assert.match(source,/'#ffff00':0\.90/);
  assert.match(source,/'#0000ff':1\.18/);
});
