import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../app/src/main/assets/www/index.html', import.meta.url),'utf8');
const java=fs.readFileSync(new URL('../app/src/main/java/jp/shizukuru/mixinglab/MainActivity.java', import.meta.url),'utf8');
test('settings exposes the official Shizukuru page through the native external-link bridge',()=>{
  assert.match(html,/id="drawOfficialSite"/);
  assert.match(html,/https:\/\/nullnode\.studio\/shizukuru\//);
  assert.match(html,/ShizukuruExternalLink\.openUrl/);
  assert.match(java,/addJavascriptInterface\(new ExternalLinkBridge\(\), "ShizukuruExternalLink"\)/);
  assert.match(java,/"https"\.equalsIgnoreCase\(scheme\)/);
  assert.match(java,/host\.equalsIgnoreCase\("nullnode\.studio"\)/);
});
