# Unified Results Section Design

**Goal:** Simplify the calculator output into one cohesive results section that is easy to scan and reduces visual noise.

## Summary
- Merge the current results and courier estimate panels into a single results card.
- Present totals first, then a compact summary, then warnings, then the detailed line items.
- Place the courier estimate inside the same card as a collapsible details section.
- Remove share/reset actions and the in-results report button.
- Simplify the footer to copyright + report link, keeping the helper line.

## Layout and Hierarchy
1. Primary total (USD) at the top.
2. Secondary total (DOP) shown when FX rate is available.
3. Summary rows:
   - Paid online (USD)
   - Import taxes (USD + optional DOP)
   - Total local (DOP) with a small courier/tax breakdown line
4. Warning block (grouped list).
5. Detailed line items (value, shipping, CIF, tariff, ITBIS, etc.).
6. Courier estimate details (collapsed by default) with range and disclaimers.

## Data Flow
- `calculateAndRender()` collects tax results, warnings, and line items as today.
- Courier calculations return structured data instead of writing DOM directly.
- A single `renderResults()` call builds the unified card.
- Sticky total bar uses the same unified DOP total.

## Removals
- Share button, reset button, share toast, sticky share button.
- Report button within results (footer link remains).

## Footer
- Replace "Te fue util?" prompt with a simple copyright line plus report link.
- Keep the helper line below ("Algo no cuadra? ...").

## Risks and Edge Cases
- No FX rate: show USD totals only and a helper note for DOP total.
- Import Fees: show badge and adjust local total to avoid double counting.
- Missing inputs: display a single empty-state message in the results card.