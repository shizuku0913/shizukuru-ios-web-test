import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('app/src/main/assets/www/index.html','utf8');
const java=fs.readFileSync('app/src/main/java/jp/shizukuru/mixinglab/MainActivity.java','utf8');

test('v10.8.62 adds dedicated seventh eraser control without changing primary palettes',()=>{
  assert.match(html,/let drawEraserSelected=false/);
  assert.match(html,/eraser\.className='draw-palette draw-eraser'/);
  assert.match(html,/eraser\.setAttribute\('aria-label',eraserLabel\)/);
  assert.match(html,/drawEraserSelected=true/);
});

test('v10.8.62 Web fallback erases transparency rather than painting white',()=>{
  assert.match(html,/drawStrokeEraser=drawEraserSelected/);
  assert.match(html,/drawCtx\.globalCompositeOperation='destination-out'/);
  assert.match(html,/drawColorCache=drawEraserSelected\?'#ffffff'/);
});

test('v10.8.62 Android native brush carries explicit eraser mode',()=>{
  assert.match(html,/setBrush\(\s*activeDrawColor\(\),drawBrushSize,alpha,wet,!!drawColorUsable,!!drawEraserSelected/);
  assert.match(java,/boolean enabled, boolean eraser/);
  assert.match(java,/brushEraser = eraser/);
  assert.match(java,/PorterDuff\.Mode\.CLEAR/);
  assert.match(java,/!brushEraser && brushWet>0\.08f/);
});

test('v10.8.62 recovery remembers eraser selection',()=>{
  assert.match(html,/eraserSelected:Boolean\(drawEraserSelected\)/);
  assert.match(html,/drawEraserSelected=Boolean\(record\.eraserSelected\)/);
});
