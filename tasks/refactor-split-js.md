# Task: Refactor single-file app into base HTML + external JS (no functional changes)

## Objective
Refactor `friendly-analyzer (5).html` so the project is more maintainable by extracting the inline JavaScript into external `.js` file(s), while preserving **100% identical runtime behavior**.

Constraints:
- **No functional changes** (no bug fixes, no feature work, no behavior changes).
- Keep “open the HTML file in a browser” working (no build tooling, no bundlers).
- No new dependencies.
- Preserve existing CSS and HTML markup except for script tag changes.

## Current Repo State
- Repo contains:
  - `friendly-analyzer (5).html`
  - `AGENTS.md`
- Jujutsu (`jj`) is being used. `jj status` shows working copy is clean.

## Key Findings (from exploration)
### Global functions required by inline HTML handlers
The HTML contains inline handlers and generated `onclick` attributes. These functions MUST remain globally accessible (i.e., defined in global scope via non-module `<script src>` tags):
- `closeSaveModal()`
- `confirmSaveAnalysis()`
- `closeCompareModal()`
- `confirmCompareAnalyses()`
- `deleteAnalysis(id)` (referenced via `onclick` in `renderSavedAnalysesList()`)
- `deleteMatch(matchId)` (referenced via `onclick` in `renderMatches()`)

### Script ordering matters
The inline JS relies on globals and function hoisting. When split into files, load order must preserve symbol availability.

Recommended load order (all classic scripts, no `type="module"`):
1. `js/state.js` (constants + shared global state)
2. `js/utils.js` (pure helpers / computation; depends on state)
3. `js/api.js` (fetch helpers; depends on state)
4. `js/render.js` (DOM rendering; depends on state + utils)
5. `js/app.js` (event wiring + orchestration; depends on everything)

### Pre-existing behavior to preserve
A call site exists:
- `showComparisonView(analysis1, analysis2)`

There is **no definition** of `showComparisonView` in the current file. If the UI path triggers it, the current app would throw a `ReferenceError`. Because this refactor is **no functional changes**, we must preserve current behavior and NOT add this missing function as part of the split.

## Success Criteria (MANDATORY)
### Functional (must behave the same)
1. Loading matches via Club ID works exactly as before.
2. Adding a match by ID works exactly as before.
3. Match filtering (All/Wins/Draws/Losses) works exactly as before.
4. Player table sorting, hide-row, hide-column, restore rows/cols works exactly as before.
5. Download CSV works exactly as before.
6. Save Analysis / Compare Analyses modals open/close exactly as before.
7. Saved analyses persist in localStorage exactly as before.

### Observable
1. No new errors in browser console during normal use.
2. UI renders (same DOM sections become visible, same counts/labels).
3. Network requests still go to `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod` endpoints.

### Pass/Fail (binary)
- PASS if manual smoke test cases below all succeed and there are **no new** console errors.
- FAIL if any existing workflow breaks due to JS splitting or script ordering.

## Test Plan
### Objective
Verify the refactor introduces **zero functional changes** and the page still works when opened locally.

### Prerequisites
- Use a modern browser.
- Optionally serve over HTTP (recommended):
  - `python3 -m http.server 8000` then open `http://localhost:8000/` and click `friendly-analyzer (5).html`.

### Test Cases
1. **Page load**: open the HTML → expected: status text prompts for Club ID; no console errors.
2. **Load Matches**: enter a known Club ID, click **Load Matches** → expected: status transitions loading → success; overview and match list render.
3. **Expand/Collapse**: click a match entry → expected: expands/collapses; delete buttons and external link still work.
4. **Add Match by ID**: enter a match ID, click **Add Match** → expected: match appears; status success.
5. **Filters**: click All/Wins/Draws/Losses → expected: list updates and match title count updates.
6. **Player table interactions**:
   - click column header to sort → expected: sort toggles and indicator updates
   - click row to hide → expected: row hides
   - hide a column via ✕ → expected: column hides
   - restore all rows/cols → expected: all visible
7. **Download CSV**: click **Download CSV** → expected: file downloads.
8. **Save Analysis**: click **Save Analysis**, enter name, save → expected: success status; refresh page, confirm saved analysis still exists via Compare modal.

### Success Criteria
All test cases pass.

## Implementation Plan (atomic commits via `jj commit -m`)
### Commit 1: Add task plan file
- Add this task plan under `tasks/`.

Commands:
- `jj status`
- `jj file track tasks/refactor-split-js.md`
- `jj commit -m "docs: add refactor task plan for JS split"`

### Commit 2: Extract JS into external files (no behavior changes)
1. Create `js/` files and move code blocks verbatim:
   - `js/state.js`: constants + global state declarations
   - `js/utils.js`: pure helper functions and data calculations
   - `js/api.js`: all `fetch*` functions and API calls
   - `js/render.js`: DOM rendering + UI update functions
   - `js/app.js`: event wiring + orchestration (`loadMatches`, `addMatch`, `downloadCSV`, etc.)
2. Update `friendly-analyzer (5).html`:
   - Remove inline `<script> ... </script>`
   - Add script tags at the end of `<body>` in required order:
     - `<script src="js/state.js"></script>`
     - `<script src="js/utils.js"></script>`
     - `<script src="js/api.js"></script>`
     - `<script src="js/render.js"></script>`
     - `<script src="js/app.js"></script>`
3. Verify that inline `onclick` handlers still resolve (global scope).
4. Run the full manual test plan.

Commands:
- `jj status` / `jj diff`
- `jj file track js/state.js js/utils.js js/api.js js/render.js js/app.js`
- `jj commit -m "refactor: split inline JS into external files"`

## Notes on Jujutsu workflow
- `jj commit -m` is safe and convenient here; it’s equivalent to `jj describe -m ...` then `jj new`.
- New files must be explicitly added with `jj file track ...`.

## Delegation
Implementation should be done by subagents:
- One agent to do the mechanical extraction/splitting.
- Another agent to audit load order + global function accessibility for `onclick` handlers.
- Optional third agent to re-run search and confirm no missing symbol definitions were introduced.
