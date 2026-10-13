import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { ProfileSchema } from '../src/profile/schema';

it('profile.json conforms to the schema', () => {
  const p = ProfileSchema.parse(JSON.parse(readFileSync('src/profile/profile.json', 'utf8')));
  expect(p.email).toBe('ashwinbkrish@gmail.com');
  expect(p.experience.length).toBe(3);
});

it('keeps address1/address2 and the filled details', () => {
  const p = ProfileSchema.parse(JSON.parse(readFileSync('src/profile/profile.json', 'utf8')));
  expect(p.location.address1).toContain('RKC Enclave');
  expect(p.location.address2).toContain('BEML');
  expect(p.location.city).toBe('Bengaluru');
});
