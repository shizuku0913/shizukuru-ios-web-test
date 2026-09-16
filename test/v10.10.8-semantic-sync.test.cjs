const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/www/index.html'),'utf8');
test('v10.10.8 encyclopedia family grouping prefers current published official HEX',()=>{
  assert.match(html,/const familyHex=published\?\.hex\|\|row\.item\.canonicalHex\|\|row\.item\.hex/);
});
test('v10.10.8 pastel purple secret recipe is regenerated for the new purple target',()=>{
  const m=html.match(/"パステルむらさき":\{"parts":\[(.*?)\],"water":([0-9.]+)\}/);
  assert.ok(m);
  assert.match(m[1],/"マゼンタ","parts":10/);
  assert.match(m[1],/"しろ","parts":18/);
  assert.doesNotMatch(m[1],/"くろ","parts":14/);
});
