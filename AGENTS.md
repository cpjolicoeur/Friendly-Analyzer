# AGENTS.md — Friendly-Analyzer

This repository is intentionally minimal: it currently contains a single self-contained HTML file.

- Primary artifact: `friendly-analyzer (5).html`
- Runtime: browser (vanilla JS + DOM APIs)
- External API: `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod`
- No Cursor rules found (`.cursor/rules/` or `.cursorrules` not present)
- No Copilot instructions found (`.github/copilot-instructions.md` not present)

---

## 1) Build / Lint / Test Commands

### Build

No build step is configured.

- Run: open `friendly-analyzer (5).html` in a modern browser.

Optional (recommended for consistent browser behavior): serve the file over HTTP.

- Python:
  - `python3 -m http.server 8000`
  - then visit `http://localhost:8000/` and open `friendly-analyzer (5).html`
- Node (if you already have it installed globally):
  - `npx http-server . -p 8000`

### Lint

No lint/format tooling is configured (no ESLint/Prettier/EditorConfig, etc.).

If you add linting tooling in the future, do it intentionally (new files, deps, and CI), and confirm with Mojo first.

### Tests

No test framework is configured.

#### Running a single test

Not applicable (there are currently no automated tests).

#### Manual “smoke test” checklist (use this instead)

1. Open the page.
2. Enter a Club ID and change "Number of Games" option to 10 matches then click **Load Matches**.
3. Verify:
   - Status text transitions from loading → success/error.
   - Overview tiles render (match record, team stats, player table).
   - Match list renders; expand/collapse works.
4. Try:
   - “Add Match by ID” flow.
   - Filter buttons (All/Wins/Draws/Losses).
   - Download CSV.
   - Save Analysis and Compare Analyses (localStorage).

---

## 2) Code Style Guidelines

Because there are no formal configs, follow the existing style in `friendly-analyzer (5).html`.

### General principles

- Make the smallest reasonable change.
- Avoid drive-by refactors.
- Prefer clarity over cleverness.
- Keep the app working when loaded directly in a browser.

### File structure & organization

- The file contains:
  - `<style>` block (CSS)
  - `<script>` block (JavaScript)
- Keep related logic grouped together (e.g., saved analyses functions together; match rendering together).
- Prefer adding new helpers near similar helpers instead of scattering.

### Formatting

- Indentation: **2 spaces** in HTML/CSS/JS.
- Quotes:
  - JavaScript strings: **double quotes** (`"`)
  - Template literals: backticks when interpolating.
- Semicolons: used consistently; keep using them.
- Braces: K&R / Egyptian style (`if (...) { ... }`).

### Naming conventions

- JavaScript:
  - `camelCase` for variables and functions (`loadMatches`, `playerNamesCache`).
  - `SCREAMING_SNAKE_CASE` for constants (`API_BASE`, `POSITION_ORDER`).
- HTML/CSS:
  - `kebab-case` for ids/classes (`status-container`, `btn-primary`).
  - Prefer semantic class names; avoid random abbreviations.

### JavaScript patterns

- Prefer `const` by default; use `let` only when reassigned.
- Async code:
  - Use `async/await` for fetch flows.
  - Check `response.ok` and throw meaningful errors when needed.
- Data transformations:
  - Use standard array utilities: `map`, `filter`, `reduce`, `find`, `forEach`.
  - Use `Set` for uniqueness (already used for hidden rows/cols, positions).
- DOM:
  - Use vanilla APIs: `document.getElementById`, `querySelector(All)`, `addEventListener`.
  - When building DOM nodes, prefer `document.createElement` over string concatenation when practical.
  - If you must use `innerHTML`, ensure inputs are not user-controlled (avoid XSS risk).

### Error handling & user feedback

- Prefer:
  - A user-facing status via `setStatus(msg, type)` for expected failures.
  - `console.error` / `console.warn` for diagnostics.
- Do not swallow errors silently.
- Keep catch blocks meaningful (log + recover or rethrow).

### State management

- Current pattern is global state in the `<script>`:
  - `allMatches`, `clubId`, `squadId`, caches, sort state, hidden row/col sets, etc.
- If adding more state:
  - Keep it near existing state definitions.
  - Keep state transitions explicit.

### CSS conventions

- The CSS uses:
  - Flexbox/Grid for layout
  - RGBA for transparency
  - Transitions/hover states
- Keep selector naming consistent (`kebab-case`).
- Avoid introducing CSS frameworks unless explicitly requested.

### Performance & correctness

- Avoid unnecessary repeated computation on large match sets:
  - If you add expensive calculations, consider caching results keyed on `allMatches`.
- Be careful with numeric conversions (`parseInt`, `toFixed`) and missing data (`?.` + defaults).

### External dependencies

- There are currently none.
- Do not add new dependencies (npm packages, CDNs) without explicit approval from Mojo.

---

## Repo-specific notes

- The app calls a production API (`API_BASE`). Treat it as an external dependency:
  - Handle transient failures gracefully.
  - Avoid spamming requests (don’t add tight loops without delays/backoff).
- Persistence uses `localStorage` key `mfl_saved_analyses`.

---

## Version control

- Use Jujutsu (`jj`) for all version control tasks.
- Do not run Git commands directly.
- Examples: `jj status`, `jj diff`, `jj log`, `jj commit`.

---

## When in doubt

- Match surrounding code.
- Keep changes minimal and reversible.
- Ask Mojo before introducing new tooling, file splits, or framework migrations.
