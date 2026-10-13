# Job Autofill Extension

A Chrome extension that fills job application forms from your own profile. It fills what it's confident about, highlights what it isn't, and never submits anything. You review and click Submit yourself.

Everything runs locally. Your profile and API key are stored in `chrome.storage.local` on your machine. There is no backend and no telemetry.

---

## Requirements

- Node.js 20 or newer
- pnpm (`npm install -g pnpm`)
- Google Chrome (or any Chromium browser: Edge, Brave, Arc)
- An Anthropic API key, for the LLM fallback step (optional for M1, required from M2)

---

## Installation

### 1. Scaffold the project (first time only)

```bash
pnpm dlx wxt@latest init job-autofill
# choose: React, pnpm
cd job-autofill
pnpm add zustand zod
pnpm add -D vitest jsdom @types/chrome
```

Copy `CLAUDE.md` into the repo root so Claude Code has the architecture and rules.

### 2. Install dependencies (existing clone)

```bash
git clone <your-repo-url> job-autofill
cd job-autofill
pnpm install
```

### 3. Run in development

```bash
pnpm dev
```

WXT opens a fresh Chrome window with the extension already loaded and hot-reloads on every save. Use this window for testing.

### 4. Build and install permanently

```bash
pnpm build
```

Then load it into your everyday Chrome:

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `.output/chrome-mv3` folder
5. Pin the extension from the puzzle-piece menu

After pulling new changes, run `pnpm build` again and click the reload icon on the extension card.

---

## First-time setup

### 1. Create your profile

Your resume is parsed once into `src/profile/profile.json`. In Claude Code:

> Here is my resume. Parse it into profile.json following the schema in src/profile/schema.ts. Leave any field you can't find empty rather than guessing.

Then open the extension popup → **Profile** and check every field. Fix anything the parser got wrong.

### 2. Fill the answer bank

Popup → **Answer bank**. These are the questions that show up on almost every form and aren't on a resume:

| Key | Example |
|---|---|
| Current CTC | 24 LPA |
| Expected CTC | 32 LPA |
| Notice period | 60 days, negotiable |
| Willing to relocate | Yes |
| Preferred locations | Bangalore, Remote |
| Work authorization | Indian citizen |
| Total experience | 5 years |
| Gender / disability / veteran (optional) | Prefer not to say |

The answer bank grows over time: when you manually edit a field the extension skipped, it asks whether to save that answer for next time.

### 3. Upload your resume file

Popup → **Profile** → **Resume file**. Upload your PDF. It's stored locally and attached automatically to resume upload fields.

### 4. Add your API key

Popup → **Settings** → paste your Anthropic API key. It's used only by the background service worker, only for fields the deterministic matcher couldn't handle. Leave it blank to run heuristic-only.

---

## Using it

1. Open a job application page.
2. Click the extension icon → **Fill this page** (or use the keyboard shortcut, default `Alt+Shift+F`).
3. Fields turn colored:
   - **Green**: filled from your profile
   - **Blue**: drafted by the LLM (free-text answers, read these)
   - **Amber**: found but not filled, needs you
4. The popup shows a fill report: counts of filled, drafted, and skipped fields.
5. Review everything, fix the amber fields, and submit yourself.

On multi-step forms (Workday, LinkedIn Easy Apply), click **Fill this page** again on each step, or turn on **Auto-fill on step change** in Settings.

---

## How it works

```
Popup click
   │
   ▼
Content script (runs on the page)
   │  1. Detect ATS → pick adapter (greenhouse, lever, workday, ...)
   │  2. Discover fields: inputs, selects, textareas, comboboxes,
   │     file inputs — including iframes and shadow roots
   │  3. Resolve each field's label
   │  4. Deterministic match: autocomplete attr, name/id, label,
   │     aria-label, placeholder → synonym map → profile key
   │  5. Fill matched fields with native setters + input/change events
   │
   ▼  unmatched fields {label, type, options}
Background service worker
   │  6. Send unmatched fields + profile to Claude
   │  7. Get back {fieldId, value, confidence}
   │
   ▼
Content script
      8. Fill only high-confidence answers; highlight the rest
      9. Report results to popup
```

**Why two passes:** the deterministic pass is instant, free, and correct for the common fields (name, email, phone, LinkedIn URL). The LLM only sees what's left, which keeps it cheap and keeps your full profile off the network for most forms.

**Why adapters:** every ATS builds dropdowns, date pickers, and multi-step flows differently. The core filler handles plain HTML; each adapter in `src/adapters/` overrides detection and widget handling for one site.

---

## Project structure

```
src/
  entrypoints/
    popup/            Popup UI (React)
    content.ts        Content script, runs on job pages
    background.ts     Service worker, makes LLM calls
  profile/
    schema.ts         zod schema for the profile
    profile.json      Your parsed resume (gitignored)
    answerBank.ts     Recurring question answers
  fill/
    core.ts           Field discovery and label resolution
    match.ts          Deterministic matcher + synonym map
    llm.ts            Claude fallback
    setters.ts        Value setters for each input type
  adapters/
    greenhouse.ts
    lever.ts
    workday.ts
    ashby.ts
    naukri.ts
    linkedin.ts
tests/
  fixtures/<ats>/     Saved real application pages
```

Add `src/profile/profile.json` and any resume files to `.gitignore`.

---

## Testing

```bash
pnpm test
```

Tests run the filler against saved HTML snapshots of real application pages. To add a fixture: open an application page, save it (Ctrl+S → "Webpage, HTML only") into `tests/fixtures/<ats>/`, and write a test asserting which fields get filled with which values.

---

## Supported sites

| Site | Status |
|---|---|
| Greenhouse | M1 |
| Lever | M1 |
| Workday | M3 |
| Ashby | M3 |
| Naukri | M4 |
| LinkedIn Easy Apply | M4 |
| Anything else | Generic filler, results vary |

---

## Troubleshooting

**Field looks filled but the form says it's empty.** The site uses a framework-controlled input. Check that `setters.ts` uses the native value setter and dispatches both `input` and `change` events. Some sites also need a `blur` event.

**Nothing happens on the page.** The form is probably inside an iframe. Confirm `allFrames: true` is set for the content script, and check the console of the iframe (DevTools → frame dropdown at the top of the Console tab).

**Dropdown not filled.** It's a custom combobox, not a `<select>`. It needs a handler in that site's adapter.

**Resume upload didn't attach.** Some sites validate on drag-drop only. Check that the adapter dispatches `change` after assigning files via `DataTransfer`.

**LLM step not running.** Check the API key in Settings and look at the service worker logs: `chrome://extensions` → the extension card → **Inspect views: service worker**.

---

## Rules this extension follows

- Never clicks Submit, Apply, or Next on its own.
- Never fills a field it isn't confident about.
- Never sends data anywhere except the Anthropic API, and only when the LLM pass runs.