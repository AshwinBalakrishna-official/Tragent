import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import type { FillReport } from '../../fill/run';
import { DEFAULT_PROFILE, loadAnswerBank, loadProfile, resetProfile, saveProfile, saveResume } from '../../profile/answerBank';
import { ANSWER_KEYS, AnswerBankSchema, ProfileSchema } from '../../profile/schema';

type Tab = 'fill' | 'profile' | 'answers';

function App() {
  const [tab, setTab] = useState<Tab>('fill');
  const [reports, setReports] = useState<FillReport[]>([]);
  const [profileText, setProfileText] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadProfile().then((p) => setProfileText(JSON.stringify(p, null, 2)));
    loadAnswerBank().then(setAnswers);
  }, []);

  const fill = async () => {
    const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!t?.id) return;
    const r = await chrome.tabs.sendMessage(t.id, { type: 'fill' });
    setReports(r ? [r] : []);
  };
  const sum = (k: 'filled' | 'drafted' | 'skipped') => reports.reduce((n, r) => n + r[k].length, 0);

  const onSaveProfile = async () => {
    try {
      await saveProfile(ProfileSchema.parse(JSON.parse(profileText)));
      setMsg('Profile saved');
    } catch (e) {
      setMsg(`Invalid profile: ${(e as Error).message.slice(0, 120)}`);
    }
  };
  const onSaveAnswers = async () => {
    await chrome.storage.local.set({ answerBank: AnswerBankSchema.parse(answers) });
    setMsg('Answers saved');
  };

  return (
    <div style={{ width: 320, padding: 12, fontFamily: 'sans-serif', fontSize: 13 }}>
      <nav style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {(['fill', 'profile', 'answers'] as Tab[]).map((t) => (
          <button key={t} onClick={() => { setTab(t); setMsg(''); }} disabled={tab === t}>{t}</button>
        ))}
      </nav>
      {tab === 'fill' && (
        <>
          <button onClick={fill}>Fill this page</button>
          {reports.length > 0 && <p>Filled {sum('filled')} · Drafted {sum('drafted')} · Skipped {sum('skipped')}</p>}
        </>
      )}
      {tab === 'profile' && (
        <>
          <textarea rows={14} style={{ width: '100%' }} value={profileText} onChange={(e) => setProfileText(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={onSaveProfile}>Save profile</button>
            <button onClick={async () => {
              await resetProfile();
              setProfileText(JSON.stringify(DEFAULT_PROFILE, null, 2));
              setMsg('Reset to bundled default profile');
            }}>Reset to default</button>
            <label>
              Import JSON{' '}
              <input type="file" accept="application/json,.json" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const p = ProfileSchema.parse(JSON.parse(await f.text()));
                  await saveProfile(p);
                  setProfileText(JSON.stringify(p, null, 2));
                  setMsg(`Imported ${f.name}`);
                } catch (err) {
                  setMsg(`Invalid profile: ${(err as Error).message.slice(0, 120)}`);
                }
              }} />
            </label>
          </div>
          <label style={{ display: 'block', marginTop: 8 }}>
            Resume file{' '}
            <input type="file" accept=".pdf,.doc,.docx" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) { await saveResume(f); setMsg(`Resume stored: ${f.name}`); }
            }} />
          </label>
        </>
      )}
      {tab === 'answers' && (
        <>
          {ANSWER_KEYS.map((k) => (
            <label key={k} style={{ display: 'block', marginBottom: 4 }}>
              {k}
              <input style={{ width: '100%' }} value={answers[k] ?? ''} onChange={(e) => setAnswers({ ...answers, [k]: e.target.value })} />
            </label>
          ))}
          <button onClick={onSaveAnswers}>Save answers</button>
        </>
      )}
      {msg && <p>{msg}</p>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
