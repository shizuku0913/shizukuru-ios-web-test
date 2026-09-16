import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const java = readFileSync(new URL('../app/src/main/java/jp/shizukuru/mixinglab/MainActivity.java', import.meta.url), 'utf8');
const gradle = readFileSync(new URL('../app/build.gradle', import.meta.url), 'utf8');
const html = readFileSync(new URL('../app/src/main/assets/www/index.html', import.meta.url), 'utf8');

test('support purchase uses a non-consumable Google Play Billing bridge', () => {
  assert.match(gradle, /com\.android\.billingclient:billing:7\.1\.1/);
  assert.match(java, /SUPPORT_PRODUCT_ID\s*=\s*"shizukuru_support_300"/);
  assert.match(java, /addJavascriptInterface\(new SupportPurchaseBridge\(\), "ShizukuruSupportPurchase"\)/);
  assert.match(java, /BillingClient\.ProductType\.INAPP/);
  assert.match(java, /acknowledgePurchase/);
  assert.doesNotMatch(java, /consumeAsync/);
  assert.match(java, /queryPurchasesAsync/);
  assert.match(html, /ShizukuruSupportPurchase\.start/);
  assert.match(html, /ShizukuruSupportPurchase\?\.isPurchased/);
});
