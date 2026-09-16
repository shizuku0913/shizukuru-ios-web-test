import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('app/src/main/assets/www/index.html','utf8');

test('official discovery cleanup deduplicates by official name, never by recipe identity',()=>{
  const block=source.match(/function removeDuplicateOfficialRecipes\(\)\{[\s\S]*?\n\}/)?.[0]||'';
  assert.match(block,/normalizeOfficialEncyclopediaName\(entry\?\.name\)/);
  assert.doesNotMatch(block,/recipeIdentityKey\(entry\.recipe\)/);
});

test('official discovery is persisted before discovery presentation',()=>{
  const flow=source.match(/discoveredColors\.push\(found\);[\s\S]{0,700}?DiscoveryPresentation\.show\(found,'found'\);/)?.[0]||'';
  assert.match(flow,/ColorBookState\.commitOfficial\(entry\.name\)/);
  assert.ok(flow.indexOf('commitOfficial(entry.name)') < flow.indexOf("DiscoveryPresentation.show(found,'found')"));
});

test('official commit verifies the just-earned name in primary storage',()=>{
  const block=source.match(/commitOfficial\(expectedName=null\)\{[\s\S]*?\n  \},/)?.[0]||'';
  assert.match(block,/PersistenceLifecycle\.readJSON\(DISCOVERY_STORAGE_KEY,\[\]\)/);
  assert.match(block,/persisted\.some/);
});
