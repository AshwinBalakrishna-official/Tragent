function fire(el: HTMLElement, types: string[]) {
  for (const t of types) el.dispatchEvent(new Event(t, { bubbles: true }));
}

/** Use the prototype's native setter so React/Vue-controlled inputs register the change. */
export function setText(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value);
  fire(el, ['input', 'change', 'blur']);
}

export function setSelect(el: HTMLSelectElement, optionText: string): boolean {
  const opt = Array.from(el.options).find((o) => o.text.trim().toLowerCase() === optionText.toLowerCase());
  if (!opt) return false;
  el.value = opt.value;
  fire(el, ['input', 'change']);
  return true;
}

export function setChecked(el: HTMLInputElement, checked: boolean) {
  if (el.checked !== checked) el.click();
}

export function setFile(el: HTMLInputElement, file: File) {
  const dt = new DataTransfer();
  dt.items.add(file);
  el.files = dt.files;
  fire(el, ['input', 'change']);
}
