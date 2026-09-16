import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const gradle = fs.readFileSync(new URL('../app/build.gradle', import.meta.url), 'utf8');

test('Billing remains enabled', () => {
  assert.match(gradle, /com\.android\.billingclient:billing:7\.1\.1/);
});

test('legacy Kotlin JDK compatibility artifacts are excluded', () => {
  assert.match(gradle, /module:\s*'kotlin-stdlib-jdk7'/);
  assert.match(gradle, /module:\s*'kotlin-stdlib-jdk8'/);
});
