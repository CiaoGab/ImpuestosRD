# Unified Results Section Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current multi-panel results UI with a single cohesive results card, removing share/reset/report buttons in the results area and simplifying the footer copy.

**Architecture:** Keep calculations in `src/app.js` but render everything through a single `renderResults()` call in `src/ui/render.js`. The courier estimate becomes a collapsible subsection of the unified results card. HTML is simplified to remove unused controls and inline report buttons.

**Tech Stack:** Static HTML, vanilla JavaScript, no build step.

### Task 1: HTML cleanup + structure test

**Files:**
- Create: `scripts/ui-structure.test.mjs`
- Modify: `index.html`

**Step 1: Write the failing test**

```js
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
```

**Step 2: Run test to verify it fails**

Run: `node scripts/ui-structure.test.mjs`
Expected: FAIL with missing removal of share/reset/report IDs and missing copyright.

**Step 3: Write minimal implementation**

Update `index.html`:
- Remove the share/reset buttons block.
- Remove `#feedback-link-primary` block and its helper line.
- Remove `#share-toast` and `#sticky-share-btn`.
- Merge courier output into the `#results` card (single results container).
- Simplify footer line to `Copyright <year> ImpuestosRD · Reportar un problema` and keep the helper line below.

**Step 4: Run test to verify it passes**

Run: `node scripts/ui-structure.test.mjs`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/ui-structure.test.mjs index.html
git commit -m "feat: simplify results layout in HTML"
```

### Task 2: JS cleanup + unified render

**Files:**
- Create: `scripts/app-removals.test.mjs`
- Modify: `src/app.js`
- Modify: `src/ui/render.js`

**Step 1: Write the failing test**

```js
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
```

**Step 2: Run test to verify it fails**

Run: `node scripts/app-removals.test.mjs`
Expected: FAIL because share/reset logic still exists.

**Step 3: Write minimal implementation**

Update `src/app.js`:
- Remove share/reset state and event listeners.
- Remove share URL building and clipboard logic.
- Refactor courier calculation to return structured data instead of DOM writes.
- Pass courier data into `renderResults()` and remove direct `#courier-results` rendering.

Update `src/ui/render.js`:
- Render a single unified card with: totals, summary rows, warnings, line items, and courier details section.
- Show empty state when required inputs are missing.
- Update sticky total bar using the unified DOP total.

**Step 4: Run test to verify it passes**

Run: `node scripts/app-removals.test.mjs`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/app-removals.test.mjs src/app.js src/ui/render.js
git commit -m "feat: unify results rendering and remove share/reset logic"
```

## Manual Verification Checklist
- Under $200 with value+weight: unified card shows USD total and line items.
- Over $200 with value only: shows warning for missing courier freight.
- With FX rate: DOP total appears and sticky bar updates.
- Import Fees checked: tax badge appears and DOP total excludes due taxes.
- Footer shows copyright + report link; no in-results report button.