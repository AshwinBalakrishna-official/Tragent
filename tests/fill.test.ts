import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { fillPage } from '../src/fill/run';
import { ProfileSchema } from '../src/profile/schema';

const profile = ProfileSchema.parse({
  firstName: 'Asha', lastName: 'Rao', fullName: 'Asha Rao', email: 'asha@example.com', phone: '+91 99999 00000',
  currentCompany: 'Initech',
  links: { linkedin: 'https://linkedin.com/in/asha', github: 'https://github.com/asha' },
});
const bank = { expectedCtc: '32 LPA' };
const resume = new File(['%PDF-1.4'], 'asha-resume.pdf', { type: 'application/pdf' });

function load(path: string) {
  document.documentElement.innerHTML = readFileSync(path, 'utf8');
}
const val = (sel: string) => (document.querySelector(sel) as HTMLInputElement).value;

describe('greenhouse (real page: anthropic job)', () => {
  it('fills confident fields, uploads resume, never submits', () => {
    load('tests/fixtures/greenhouse/anthropic-job.html');
    const submit = vi.fn((e: Event) => e.preventDefault());
    document.querySelectorAll('form').forEach((f) => f.addEventListener('submit', submit));
    const report = fillPage(document, 'https://job-boards.greenhouse.io/anthropic/jobs/4461450008', profile, bank, resume);
    expect(report.adapter).toBe('greenhouse');
    expect(val('#first_name')).toBe('Asha');
    expect(val('#last_name')).toBe('Rao');
    expect(val('#email')).toBe('asha@example.com');
    expect(val('#phone')).toBe('+91 99999 00000');
    expect(val('#question_8581812008')).toBe('https://linkedin.com/in/asha');
    expect((document.querySelector('#resume') as HTMLInputElement).files?.[0]?.name).toBe('asha-resume.pdf');
    // custom react-select comboboxes with unknown answers are highlighted, not guessed
    expect(report.skipped.map((s) => s.id)).toContain('question_8590525008');
    expect(submit).not.toHaveBeenCalled();
  });
});

describe('lever (real page: leverdemo apply)', () => {
  it('fills by name/label and uploads resume', () => {
    load('tests/fixtures/lever/leverdemo-apply.html');
    const report = fillPage(document, 'https://jobs.lever.co/leverdemo/ad208490/apply', profile, bank, resume);
    expect(report.adapter).toBe('lever');
    expect(val('[name=name]')).toBe('Asha Rao');
    expect(val('[name=email]')).toBe('asha@example.com');
    expect(val('[name=phone]')).toBe('+91 99999 00000');
    expect(val('[name=org]')).toBe('Initech');
    expect(val('[name="urls[LinkedIn]"]')).toBe('https://linkedin.com/in/asha');
    expect(val('[name="urls[Github]"]')).toBe('https://github.com/asha');
    expect((document.querySelector('#resume-upload-input') as HTMLInputElement).files?.[0]?.name).toBe('asha-resume.pdf');
    // EEO radios/checkboxes are never auto-selected
    expect(document.querySelectorAll('input[name="eeo[race]"]:checked').length).toBe(0);
  });
});

describe('address lines', () => {
  it('fills address line 1/2 fields', () => {
    document.body.innerHTML =
      '<form><label for="a1">Address Line 1</label><input id="a1"><label for="a2">Address Line 2</label><input id="a2"></form>';
    const p = ProfileSchema.parse({ location: { address1: '#395 RKC', address2: 'Near BEML' } });
    fillPage(document, 'https://example.com', p, {});
    expect(val('#a1')).toBe('#395 RKC');
    expect(val('#a2')).toBe('Near BEML');
  });
});
