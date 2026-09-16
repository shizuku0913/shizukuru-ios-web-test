import test from 'node:test';
import assert from 'node:assert/strict';
import {source} from './source-utils.js';
test('pigment strength accepts live Map sources used by pinch drops',()=>{
 const a=source.indexOf('const RYBPigmentStrengthProfile='),b=source.indexOf('// v10.8.28: Pinch paint-emission compatibility fix.',a),block=source.slice(a,b);
 assert.match(block,/Array\.from\(sources\|\|\[\]/); assert.doesNotMatch(block,/\(sources\|\|\[\]\)\.map/);
});
test('pinch path still uses existing threshold and drop lifecycle',()=>{
 assert.match(source,/function emitFromMaster\(\)[\s\S]*?queuePaintDrop\(selected,DROP_AMOUNT,SINGLE_DROP_RADIUS\)/);
 assert.match(source,/if\(masterGesture\.inward>=4\)beginPinchEmission\(\)/);
});
test('approved pigment settings remain unchanged',()=>{
 assert.match(source,/onset:\.52/); assert.match(source,/'#ffff00':0\.90/); assert.match(source,/'#0000ff':1\.18/);
});
