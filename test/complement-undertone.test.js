import test from 'node:test';
import assert from 'node:assert/strict';
import {source} from './source-utils.js';

test('complement undertone profile exists with calibrated red-green gray-brown anchor',()=>{
  assert.match(source,/const RYBComplementUndertoneProfile=Object\.freeze\(/);
  assert.match(source,/'#00ff00\|#ff0000':Object\.freeze\(\{anchor:Object\.freeze\(\[119,101,84\]\),maxBlend:\.72\}\)/);
});
test('undertone is strongest near equal pigment balance and fades when one dominates',()=>{
  const a=source.indexOf('const RYBComplementUndertoneProfile=');
  const b=source.indexOf('const RYBPigmentTouchTestEngine=',a);
  const block=source.slice(a,b);
  assert.match(block,/const balance=1-Math\.abs/);
  assert.match(block,/Math\.pow\(clamp\(balance,0,1\),1\.6\)/);
});
test('live aggregate applies bridge, hue-spread dulling, multi-pigment neutralization, then complement undertone',()=>{
  assert.match(source,/const bridged=RYBCMYSubtractiveBridgeProfile\.apply\(base,adjusted\);\s*const dulled=RYBHueSpreadDullingProfile\.apply\(bridged,adjusted\);\s*const neutralized=RYBMultiPigmentNeutralProfile\.apply\(dulled,adjusted\);\s*return RYBComplementUndertoneProfile\.apply\(neutralized,adjusted\)/);
});
test('magenta-green is not force-mapped by the first calibration',()=>{
  const a=source.indexOf('pairs:Object.freeze({',source.indexOf('const RYBComplementUndertoneProfile='));
  const b=source.indexOf('}),',a);
  const block=source.slice(a,b);
  assert.doesNotMatch(block,/#00ff00\|#ff00ff/);
});
