import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');
test('v10.8.53 removes obsolete standalone pigment-strength experiment',()=>{
 assert.doesNotMatch(source,/const RYBPigmentStrengthExperiment=Object\.freeze\(/);
 assert.match(source,/const RYBPigmentStrengthProfile=Object\.freeze\(/);
 assert.match(source,/const RYBPigmentTouchTestEngine=Object\.freeze\(/);
});
