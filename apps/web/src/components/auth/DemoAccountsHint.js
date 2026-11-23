const DEMO_EMAILS = ['alice@cic.test', 'bob@cic.test', 'carol@cic.test', 'dave@cic.test'];
const DEMO_PASSWORD = 'Password123!';

export function DemoAccountsHint() {
  return (
    <aside aria-label="Demo accounts" className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
      <p className="mb-1 font-medium text-slate-700">Demo accounts</p>
      <p>{DEMO_EMAILS.join(' · ')}</p>
      <p>
        Password: <code className="font-mono text-slate-800">{DEMO_PASSWORD}</code>
      </p>
    </aside>
  );
}
