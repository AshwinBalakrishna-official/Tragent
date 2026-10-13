// jsdom lacks DataTransfer; minimal stand-in so setFile can be exercised.
class FakeDataTransfer {
  private list: File[] = [];
  items = { add: (f: File) => void this.list.push(f) };
  get files() {
    const l = this.list;
    return Object.assign([...l], { item: (i: number) => l[i] ?? null }) as unknown as FileList;
  }
}
(globalThis as any).DataTransfer = FakeDataTransfer;

// jsdom only accepts a real FileList on input.files; allow our stand-in.
Object.defineProperty(HTMLInputElement.prototype, 'files', {
  configurable: true,
  get() { return this.__files ?? null; },
  set(v) { this.__files = v; },
});
