import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync('app/src/main/assets/www/index.html','utf8');
test('v10.8.77 preserves square drawing palette controls on narrow phones',()=>{
  assert.match(html,/v10\.8\.77: Pixel 10/);
  const marker=html.indexOf('v10.8.77: Pixel 10');
  const patch=html.slice(marker, marker+1400);
  assert.match(patch,/aspect-ratio:1 \/ 1;/);
  assert.match(patch,/height:auto;/);
  assert.match(patch,/gap:2px;/);
});
