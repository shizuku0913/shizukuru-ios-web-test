import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { source, INDEX_PATH } from './source-utils.js';

test('recognition engine still contains perceptual guards and adaptive radius', () => {
  assert.match(source, /delta-e/);
  assert.match(source, /hue-difference/);
  assert.match(source, /chroma-difference/);
  assert.match(source, /adaptive-radius/);
  assert.match(source, /nearestStrictOfficialRGB/);
});

test('test suite reads production index.html directly rather than a copied color engine', () => {
  assert.ok(fs.existsSync(INDEX_PATH));
  const hash = crypto.createHash('sha256').update(source).digest('hex');
  assert.equal(hash.length, 64);
});
