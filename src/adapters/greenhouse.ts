import type { Adapter } from './types';

export const greenhouse: Adapter = {
  name: 'greenhouse',
  detect: (url, doc) =>
    /greenhouse\.io/.test(url) || !!doc.querySelector('form#application_form, iframe[src*="greenhouse.io"]'),
};
