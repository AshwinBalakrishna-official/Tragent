import { z } from 'zod';

const str = z.string().default('');

export const ProfileSchema = z.object({
  firstName: str,
  lastName: str,
  fullName: str,
  email: str,
  phone: str,
  location: z.object({ city: str, state: str, country: str, postalCode: str, address: str, address1: str, address2: str }).default({
    city: '', state: '', country: '', postalCode: '', address: '', address1: '', address2: '',
  }),
  links: z.object({ linkedin: str, github: str, portfolio: str, website: str }).default({
    linkedin: '', github: '', portfolio: '', website: '',
  }),
  currentCompany: str,
  currentTitle: str,
  summary: str,
  skills: z.array(z.string()).default([]),
  experience: z
    .array(z.object({ company: str, title: str, start: str, end: str, description: str }))
    .default([]),
  education: z
    .array(z.object({ school: str, degree: str, field: str, start: str, end: str }))
    .default([]),
});
export type Profile = z.infer<typeof ProfileSchema>;

/** Recurring non-resume answers, keyed by canonical question key. */
export const AnswerBankSchema = z.record(z.string(), z.string());
export type AnswerBank = z.infer<typeof AnswerBankSchema>;

export const ANSWER_KEYS = [
  'currentCtc', 'expectedCtc', 'noticePeriod', 'willingToRelocate', 'preferredLocations',
  'workAuthorization', 'totalExperience', 'gender', 'disability', 'veteran',
] as const;

export const emptyProfile = (): Profile => ProfileSchema.parse({});
