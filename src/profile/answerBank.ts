import defaultProfile from './profile.json';
import { AnswerBankSchema, ProfileSchema, type AnswerBank, type Profile } from './schema';

// Profile and answers live in chrome.storage.local only.
/** Bundled resume-derived profile.json is the default until a different profile is saved or imported. */
export const DEFAULT_PROFILE: Profile = ProfileSchema.parse(defaultProfile);

export async function loadProfile(): Promise<Profile> {
  const { profile } = await chrome.storage.local.get('profile');
  return profile ? ProfileSchema.parse(profile) : DEFAULT_PROFILE;
}

export async function resetProfile(): Promise<void> {
  await chrome.storage.local.remove('profile');
}

export async function saveProfile(p: Profile): Promise<void> {
  await chrome.storage.local.set({ profile: ProfileSchema.parse(p) });
}

export async function loadAnswerBank(): Promise<AnswerBank> {
  const { answerBank } = await chrome.storage.local.get('answerBank');
  return AnswerBankSchema.parse(answerBank ?? {});
}

export async function saveAnswer(key: string, value: string): Promise<void> {
  const bank = await loadAnswerBank();
  await chrome.storage.local.set({ answerBank: { ...bank, [key]: value } });
}

/** Resume PDF stored locally as a data URL; rebuilt into a File for upload fields. */
export async function saveResume(file: File): Promise<void> {
  const data = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
  await chrome.storage.local.set({ resume: { name: file.name, type: file.type, data } });
}

export async function loadResume(): Promise<File | undefined> {
  const { resume } = (await chrome.storage.local.get('resume')) as {
    resume?: { name: string; type: string; data: string };
  };
  if (!resume) return undefined;
  const blob = await (await fetch(resume.data)).blob();
  return new File([blob], resume.name, { type: resume.type });
}
