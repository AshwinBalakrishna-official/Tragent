import type { Adapter } from './types';

export const lever: Adapter = {
  name: 'lever',
  detect: (url, doc) => /lever\.co/.test(url) || !!doc.querySelector('.application-page, form[action*="lever.co"]'),
};
