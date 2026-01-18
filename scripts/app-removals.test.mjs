import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

const forbiddenTokens = [
  'shareBtn',
  'copyShareUrl',
  'shareToast',
  'stickyShareBtn',
  'resetBtn'
];

for (const token of forbiddenTokens) {
  assert.ok(!app.includes(token), `Found forbidden token: ${token}`);
}