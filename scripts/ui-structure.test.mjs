import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const forbiddenIds = [
  'share-btn',
  'reset-btn',
  'share-toast',
  'sticky-share-btn',
  'feedback-link-primary'
];

for (const id of forbiddenIds) {
  assert.ok(!html.includes(`id="${id}"`), `Found forbidden id: ${id}`);
}

assert.ok(html.includes('id="footer-feedback-link"'), 'Missing footer feedback link');
assert.ok(html.includes('Reportar un problema'), 'Missing footer report text');
assert.ok(html.includes('Copyright'), 'Missing copyright text');