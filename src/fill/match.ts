import type { AnswerBank, Profile } from '../profile/schema';
import type { Field } from './core';

export interface Match {
  value: string;
  confidence: number;
  key: string;
}

type Getter = (p: Profile, a: AnswerBank) => string;

const GETTERS: Record<string, Getter> = {
  firstName: (p) => p.firstName,
  lastName: (p) => p.lastName,
  fullName: (p) => p.fullName || `${p.firstName} ${p.lastName}`.trim(),
  email: (p) => p.email,
  phone: (p) => p.phone,
  city: (p) => p.location.city,
  state: (p) => p.location.state,
  country: (p) => p.location.country,
  postalCode: (p) => p.location.postalCode,
  address: (p) => p.location.address,
  address1: (p) => p.location.address1 || p.location.address,
  address2: (p) => p.location.address2,
  linkedin: (p) => p.links.linkedin,
  github: (p) => p.links.github,
  portfolio: (p) => p.links.portfolio || p.links.website,
  website: (p) => p.links.website || p.links.portfolio,
  currentCompany: (p) => p.currentCompany,
  currentTitle: (p) => p.currentTitle,
  currentCtc: (_p, a) => a.currentCtc ?? '',
  expectedCtc: (_p, a) => a.expectedCtc ?? '',
  noticePeriod: (_p, a) => a.noticePeriod ?? '',
  totalExperience: (_p, a) => a.totalExperience ?? '',
};

/** Synonym map: profile key -> normalized label phrases (matched as whole-string or exact name/id). */
export const SYNONYMS: Record<string, string[]> = {
  firstName: ['first name', 'given name', 'firstname', 'first_name'],
  lastName: ['last name', 'family name', 'surname', 'lastname', 'last_name'],
  fullName: ['full name', 'name', 'your name', 'legal name'],
  email: ['email', 'email address', 'e-mail', 'e-mail address'],
  phone: ['phone', 'phone number', 'mobile', 'mobile number', 'telephone', 'contact number'],
  city: ['city', 'town'],
  state: ['state', 'province', 'state/province'],
  country: ['country'],
  postalCode: ['zip', 'zip code', 'postal code', 'pincode', 'pin code'],
  address: ['address', 'street address'],
  address1: ['address line 1', 'address 1', 'address1', 'address line1', 'street address line 1'],
  address2: ['address line 2', 'address 2', 'address2', 'address line2', 'street address line 2', 'apartment suite'],
  linkedin: ['linkedin', 'linkedin url', 'linkedin profile', 'linkedin profile url'],
  github: ['github', 'github url', 'github profile'],
  portfolio: ['portfolio', 'portfolio url'],
  website: ['website', 'personal website', 'website url'],
  currentCompany: ['current company', 'current employer', 'company'],
  currentTitle: ['current title', 'current job title', 'job title'],
  currentCtc: ['current ctc', 'current salary', 'current compensation'],
  expectedCtc: ['expected ctc', 'expected salary', 'salary expectations', 'desired salary'],
  noticePeriod: ['notice period'],
  totalExperience: ['total experience', 'years of experience', 'total years of experience'],
};

const AUTOCOMPLETE: Record<string, string> = {
  'given-name': 'firstName', 'family-name': 'lastName', name: 'fullName', email: 'email',
  tel: 'phone', 'address-level2': 'city', 'address-level1': 'state', country: 'country',
  'country-name': 'country', 'postal-code': 'postalCode', 'street-address': 'address', organization: 'currentCompany',
  'organization-title': 'currentTitle',
};

const clean = (s: string) => s.toLowerCase().replace(/[\[\]_\-]+/g, ' ').replace(/[^a-z0-9/@ ]/g, ' ').replace(/\s+/g, ' ').trim();

function keyFor(f: Field): { key: string; confidence: number } | null {
  const ac = AUTOCOMPLETE[f.autocomplete.toLowerCase().split(' ').pop() ?? ''];
  if (ac) return { key: ac, confidence: 0.98 };
  const sources: [string, number][] = [
    [f.name, 0.9], [f.el.id, 0.9], [f.label, 0.95], [f.el.getAttribute('aria-label') ?? '', 0.93], [f.placeholder, 0.8],
  ];
  for (const [raw, conf] of sources) {
    const text = clean(raw);
    if (!text) continue;
    for (const [key, phrases] of Object.entries(SYNONYMS)) {
      if (phrases.some((p) => clean(p) === text)) return { key, confidence: conf };
    }
  }
  return null;
}

const HIGH = 0.85;

export function matchField(f: Field, profile: Profile, bank: AnswerBank): Match | null {
  if (f.kind === 'file' || f.kind === 'checkbox' || f.kind === 'radio') return null;
  const hit = keyFor(f);
  if (!hit) return null;
  const value = GETTERS[hit.key]?.(profile, bank) ?? '';
  if (!value) return null;
  if (f.kind === 'select') {
    const opt = f.options.find((o) => o.toLowerCase() === value.toLowerCase());
    if (!opt) return { key: hit.key, value, confidence: 0.4 };
    return { key: hit.key, value: opt, confidence: hit.confidence };
  }
  return { key: hit.key, value, confidence: hit.confidence };
}

export const isConfident = (m: Match | null): m is Match => !!m && m.confidence >= HIGH;
