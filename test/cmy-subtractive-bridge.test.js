import test from 'node:test';
import assert from 'node:assert/strict';
import {source} from './source-utils.js';

test('CMY bridge is one generalized rule for cyan magenta yellow pairs',()=>{
  const a=source.indexOf('const RYBCMYSubtractiveBridgeProfile=');
  const b=source.indexOf('// v10.8.29:',a);
  assert.ok(a>=0&&b>a);
  const block=source.slice(a,b);
  assert.match(block,/allowed:new Set\(\['#00ffff','#ff00ff','#ffff00'\]\)/);
  assert.match(block,/channel\*B\[i\]\/255/);
  assert.match(block,/maxBlend:\.68/);
  assert.match(block,/active\.length!==2/);
});

test('touch-test applies CMY bridge before multi-hue dulling',()=>{
  const a=source.indexOf('const RYBPigmentTouchTestEngine=');
  const b=source.indexOf('// v10.8.25:',a);
  const block=source.slice(a,b);
  assert.match(block,/const bridged=RYBCMYSubtractiveBridgeProfile\.apply\(base,adjusted\)/);
  assert.match(block,/RYBHueSpreadDullingProfile\.apply\(bridged,adjusted\)/);
});

test('existing red green undertone and approved pigment settings remain',()=>{
  assert.match(source,/'#00ff00\|#ff0000':Object\.freeze\(\{anchor:Object\.freeze\(\[119,101,84\]\),maxBlend:\.72\}\)/);
  assert.match(source,/onset:\.52/);
  assert.match(source,/'#ffff00':0\.90/);
  assert.match(source,/'#ff00ff':1\.10/);
});
