import { detectAdapter } from '../adapters';
import type { AnswerBank, Profile } from '../profile/schema';
import { discoverFields } from './core';
import { isConfident, matchField } from './match';
import { setFile, setSelect, setText } from './setters';

export interface FillReport {
  adapter: string | null;
  filled: { id: string; label: string; value: string }[];
  drafted: { id: string; label: string; value: string }[];
  skipped: { id: string; label: string; reason: string }[];
}

const AMBER = '2px solid #f59e0b';
const GREEN = '2px solid #22c55e';

/** Heuristic pass only (M1). Never submits or clicks buttons. */
export function fillPage(doc: Document, url: string, profile: Profile, bank: AnswerBank, resume?: File): FillReport {
  const adapter = detectAdapter(url, doc);
  const report: FillReport = { adapter: adapter?.name ?? null, filled: [], drafted: [], skipped: [] };
  for (const f of discoverFields(doc)) {
    if (f.kind === 'file' && resume && /resume|cv/i.test(`${f.label} ${f.name} ${f.el.id}`)) {
      setFile(f.el as HTMLInputElement, resume);
      f.el.style.outline = GREEN;
      report.filled.push({ id: f.id, label: f.label || 'Resume', value: resume.name });
      continue;
    }
    const m = matchField(f, profile, bank);
    if (!isConfident(m)) {
      if (f.kind !== 'checkbox' && f.kind !== 'radio') {
        f.el.style.outline = AMBER;
        report.skipped.push({ id: f.id, label: f.label, reason: m ? 'low confidence' : 'no match' });
      }
      continue;
    }
    if (adapter?.fillField?.(f, m.value)) {
      report.filled.push({ id: f.id, label: f.label, value: m.value });
      continue;
    }
    let ok = false;
    if (f.kind === 'select') ok = setSelect(f.el as HTMLSelectElement, m.value);
    else if (f.kind === 'text' || f.kind === 'textarea' || f.kind === 'combobox') {
      setText(f.el as HTMLInputElement, m.value);
      ok = true;
    }
    if (ok) {
      f.el.style.outline = GREEN;
      report.filled.push({ id: f.id, label: f.label, value: m.value });
    } else {
      f.el.style.outline = AMBER;
      report.skipped.push({ id: f.id, label: f.label, reason: 'unsupported widget' });
    }
  }
  return report;
}
