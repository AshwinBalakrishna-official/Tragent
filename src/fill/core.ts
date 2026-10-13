export type FieldKind = 'text' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'file' | 'combobox';

export interface Field {
  id: string;
  el: HTMLElement;
  kind: FieldKind;
  label: string;
  name: string;
  autocomplete: string;
  placeholder: string;
  options: string[];
}

const SKIP_TYPES = new Set(['submit', 'button', 'image', 'reset', 'hidden']);
const norm = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').replace(/[*:]+$/, '').trim();

/** Collect roots to search: the document plus open shadow roots and same-origin iframes. */
function collectRoots(root: Document | ShadowRoot | Element, out: (Document | ShadowRoot | Element)[] = []) {
  out.push(root);
  root.querySelectorAll('*').forEach((el) => {
    if (el.shadowRoot) collectRoots(el.shadowRoot, out);
    if (el instanceof HTMLIFrameElement) {
      try {
        const d = el.contentDocument;
        if (d) collectRoots(d, out);
      } catch { /* cross-origin: content script runs there via allFrames */ }
    }
  });
  return out;
}

export function resolveLabel(el: HTMLElement): string {
  const doc = el.ownerDocument;
  const labelledby = el.getAttribute('aria-labelledby');
  if (labelledby) {
    const t = labelledby.split(/\s+/).map((id) => doc.getElementById(id)?.textContent ?? '').join(' ');
    if (norm(t)) return norm(t);
  }
  const aria = el.getAttribute('aria-label');
  if (norm(aria)) return norm(aria);
  const labels = (el as HTMLInputElement).labels;
  if (labels?.[0]) return norm(labels[0].textContent);
  if (el.id) {
    const l = doc.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (l) return norm(l.textContent);
  }
  const wrap = el.closest('label');
  if (wrap) return norm(wrap.textContent);
  const group = el.closest('.field, .application-field, .application-question, .form-group, [class*="field"]');
  const gl = group?.querySelector('label, legend, .application-label');
  if (gl) return norm(gl.textContent);
  return '';
}

export function discoverFields(root: Document | ShadowRoot | Element = document): Field[] {
  const fields: Field[] = [];
  let n = 0;
  const seen = new Set<Element>();
  for (const r of collectRoots(root)) {
    r.querySelectorAll('input, select, textarea').forEach((node) => {
      if (seen.has(node)) return;
      seen.add(node);
      const el = node as HTMLInputElement;
      const type = (el.getAttribute('type') ?? 'text').toLowerCase();
      if (SKIP_TYPES.has(type) || el.disabled) return;
      if (el.getAttribute('aria-hidden') === 'true') return; // library helper inputs
      let kind: FieldKind = 'text';
      if (el.tagName === 'SELECT') kind = 'select';
      else if (el.tagName === 'TEXTAREA') kind = 'textarea';
      else if (type === 'checkbox' || type === 'radio' || type === 'file') kind = type;
      else if (el.getAttribute('role') === 'combobox' || el.hasAttribute('aria-autocomplete')) kind = 'combobox';
      const options =
        el.tagName === 'SELECT' ? Array.from((el as unknown as HTMLSelectElement).options).map((o) => norm(o.text)) : [];
      const id = el.id || `af-${n}`;
      el.dataset.afId = id;
      n++;
      fields.push({
        id, el, kind,
        label: resolveLabel(el),
        name: el.getAttribute('name') ?? '',
        autocomplete: el.getAttribute('autocomplete') ?? '',
        placeholder: el.getAttribute('placeholder') ?? '',
        options,
      });
    });
  }
  return fields;
}
