import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../app/src/main/assets/www/index.html',import.meta.url),'utf8');
test('balanced 3+ pigment mixtures receive a separate neutralization pass',()=>{
  assert.match(source,/const RYBMultiPigmentNeutralProfile=Object\.freeze\(/);
  assert.match(source,/if\(active\.length<3\)return 0/);
  assert.match(source,/const neutralized=RYBMultiPigmentNeutralProfile\.apply\(dulled,adjusted\)/);
});
test('two-colour mixPair remains outside multi-pigment neutralization',()=>{
  const a=source.indexOf('const RYBPigmentTouchTestEngine=');
  const b=source.indexOf('// v10.8.25:',a);
  const block=source.slice(a,b);
  const pair=block.slice(block.indexOf('mixPair'));
  assert.doesNotMatch(pair,/RYBMultiPigmentNeutralProfile/);
});

test('v10.8.34 releases neutralization gradually when one pigment becomes dominant',()=>{
  const a=source.indexOf('const RYBMultiPigmentNeutralProfile=');
  const b=source.indexOf('const RYBPigmentTouchTestEngine=',a);
  const block=source.slice(a,b);
  assert.match(block,/Math\.pow\(balance,\.45\)/);
  assert.doesNotMatch(block,/Math\.pow\(balance,\.65\)/);
});
