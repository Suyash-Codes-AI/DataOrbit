import React, { useState } from 'react';
import { ArrowRight, BarChart3, CheckCircle2, Database, Eye, EyeOff, KeyRound, LoaderCircle, Orbit, ShieldCheck, Sparkles } from 'lucide-react';
import { SiteFooter } from './SiteFooter';

interface SignInLandingProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onGuest: () => void;
  onRecoverPassword: (email: string) => Promise<void>;
  error: string;
}

export const SignInLanding: React.FC<SignInLandingProps> = ({ onSignIn, onGuest, onRecoverPassword, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<'signin' | 'recovery' | null>(null);
  const [message, setMessage] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setBusy('signin');
    try { await onSignIn(email, password); } finally { setBusy(null); }
  };

  const recover = async () => {
    setMessage('');
    if (!email.trim()) {
      setMessage('Enter your email first, then request a reset link.');
      return;
    }
    setBusy('recovery');
    try {
      await onRecoverPassword(email);
      setMessage('Password reset instructions are on their way.');
    } finally { setBusy(null); }
  };

  return (
    <main className="auth-shell min-h-screen text-[#e9eef6]">
      <div className="auth-grid" aria-hidden="true" />
      <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
      <div className="auth-orbit auth-orbit-two" aria-hidden="true" />

      <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/10">
            <Orbit className="h-5 w-5 text-blue-300" />
          </div>
          <div>
            <p className="font-serif text-lg font-semibold tracking-tight">DataOrbit</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-slate-500">Intelligence console</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Secure workspace access
        </div>
      </nav>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-96px)] max-w-7xl items-center gap-12 px-6 pb-16 pt-6 lg:grid-cols-[1.08fr_.92fr] lg:px-10">
        <div className="auth-reveal max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/[0.06] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-blue-200">
            <Sparkles className="h-3.5 w-3.5" />
            Ask better questions of your data
          </div>
          <h1 className="font-serif text-5xl font-medium leading-[1.02] tracking-[-0.035em] text-slate-50 md:text-7xl">
            Your data has a<br />
            <span className="auth-accent-text italic">gravitational pull.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-slate-400 md:text-lg">
            Connect databases, explore documents, and turn complex datasets into decisions from one focused analytical workspace.
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {[
              [Database, 'Connected', 'Data sources'],
              [BarChart3, 'Responsive', 'Visual analysis'],
              [ShieldCheck, 'Controlled', 'Workspace access'],
            ].map(([Icon, lead, label]) => (
              <div key={String(label)} className="border-l border-slate-700/70 pl-4">
                <Icon className="mb-3 h-4 w-4 text-blue-300" />
                <p className="text-sm font-semibold text-slate-200">{String(lead)}</p>
                <p className="mt-1 text-[11px] text-slate-500">{String(label)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-reveal auth-reveal-delay mx-auto w-full max-w-md">
          <div className="auth-card rounded-[28px] border border-white/10 p-6 shadow-2xl shadow-black/30 md:p-8">
            <div className="mb-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-blue-300">Workspace gateway</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-white">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-400">Sign in to continue to your analytics workspace.</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-slate-300">Email address</span>
                <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="auth-input w-full rounded-xl px-4 py-3 text-sm outline-none" />
              </label>
              <label className="block">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">Password</span>
                  <button type="button" onClick={recover} disabled={busy !== null} className="text-[11px] text-blue-300 transition hover:text-blue-200 disabled:opacity-50">Forgot password?</button>
                </div>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="auth-input w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-slate-300" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {(error || message) && (
                <div className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs ${error ? 'border-rose-400/20 bg-rose-400/[0.07] text-rose-200' : 'border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-200'}`} role="status">
                  {error ? <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                  {error || message}
                </div>
              )}

              <button type="submit" disabled={busy !== null} className="auth-primary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70">
                {busy === 'signin' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {busy === 'signin' ? 'Opening workspace…' : 'Sign in to DataOrbit'}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-slate-600">
              <span className="h-px flex-1 bg-slate-700/70" />or<span className="h-px flex-1 bg-slate-700/70" />
            </div>

            <button type="button" onClick={onGuest} className="auth-guest group flex w-full items-center justify-between rounded-xl border border-slate-700/80 px-4 py-3 text-left transition hover:border-slate-500 hover:bg-white/[0.03]">
              <span>
                <span className="block text-sm font-medium text-slate-200">Continue as a guest</span>
                <span className="mt-0.5 block text-[11px] text-slate-500">Explore the workspace without an account</span>
              </span>
              <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-slate-300" />
            </button>
          </div>
          <p className="mt-5 text-center text-[11px] leading-5 text-slate-600">Protected by Netlify Identity. Guest sessions remain local to this browser.</p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
};
