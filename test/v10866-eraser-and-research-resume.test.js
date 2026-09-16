import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('app/src/main/assets/www/index.html','utf8');
const svg=fs.readFileSync('app/src/main/assets/www/icons/eraser-gray.svg','utf8');

test('eraser keeps a smaller white tip',()=>{
  assert.match(svg,/M9 20h10l7 24H9z/);
  assert.match(svg,/M19 20l7 24/);
  assert.doesNotMatch(svg,/M9 20h17l7 24H9z/);
});

test('awaiting-name research reproduction resumes naming instead of repeat card',()=>{
  const resume=html.indexOf("existingRecipe.entry.status==='awaiting-name'&&sameCompletedColor");
  const repeat=html.indexOf("DiscoveryPresentation.show({name:label,emoji:existingRecipe.kind==='official'?'🎨':'✨',hex},'repeat')",resume);
  assert.ok(resume>=0);
  assert.ok(repeat>resume);
  const block=html.slice(resume,repeat);
  assert.match(block,/DiscoveryPresentation\.openResearchLater\(existingRecipe\.entry,true,180\)/);
  assert.match(block,/return;/);
});
