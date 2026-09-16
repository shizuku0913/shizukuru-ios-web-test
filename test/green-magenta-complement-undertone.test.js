import test from 'node:test';
import assert from 'node:assert/strict';
import {source} from './source-utils.js';

test('green+magenta has a cool gray-violet undertone calibration',()=>{
  assert.match(source, /'#00ff00\|#ff00ff':Object\.freeze\(\{anchor:Object\.freeze\(\[126,126,151\]\),maxBlend:\.58\}\)/);
});

test('green+magenta calibration stays lighter/softer than red+cyan',()=>{
  assert.match(source, /'#00ffff\|#ff0000'.*maxBlend:\.74/);
  assert.match(source, /'#00ff00\|#ff00ff'.*maxBlend:\.58/);
});
