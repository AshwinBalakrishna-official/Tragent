import type { Field } from '../fill/core';

export interface Adapter {
  name: string;
  detect(url: string, doc: Document): boolean;
  /** Return true if the adapter handled the field itself (custom widgets). */
  fillField?(field: Field, value: string): boolean;
}
