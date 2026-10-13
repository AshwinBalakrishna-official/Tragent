import { greenhouse } from './greenhouse';
import { lever } from './lever';
import type { Adapter } from './types';

const ADAPTERS: Adapter[] = [greenhouse, lever];

export const detectAdapter = (url: string, doc: Document): Adapter | null =>
  ADAPTERS.find((a) => a.detect(url, doc)) ?? null;
