# Job Autofill Extension

Chrome MV3 extension (WXT + React + TypeScript) that fills job application
forms from a local profile. Single user, no backend.

## Hard rules
- NEVER click submit/apply buttons or trigger form submission.
- Only fill a field when confidence is high; otherwise highlight it.
- Profile and API key live in chrome.storage.local only. No telemetry.
- LLM calls happen only in the background service worker.

## Architecture
- src/profile/: schema (zod), resume-derived profile.json, answer bank
- src/fill/core.ts: field discovery (inputs, selects, textareas, comboboxes,
  file inputs) incl. iframes and shadow roots; label resolution
- src/fill/match.ts: deterministic matcher (autocomplete attr, name/id,
  label, aria-label, placeholder) + synonym map
- src/fill/llm.ts: send unmatched fields {label, type, options} + profile to
  Claude; expect JSON {fieldId, value, confidence}
- src/fill/setters.ts: native value setter + input/change events, select,
  checkbox/radio, DataTransfer file upload
- src/adapters/: greenhouse, lever, workday, ashby, naukri, linkedin
  (detect(url, dom) + widget overrides)
- Popup: "Fill this page" button, fill report (filled / drafted / skipped)

## Current milestone
M0 then M1: profile schema + Greenhouse/Lever heuristic fill.

## Testing
Save real application pages as HTML fixtures in tests/fixtures/<ats>/ and
run fill against them with Vitest + jsdom. Every adapter needs fixtures.