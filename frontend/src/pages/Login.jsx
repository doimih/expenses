import { useState } from 'react';

const emptyRegisterForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  passwordConfirmation: '',
};

const FEATURES = [
  { icon: '📊', text: 'Vizualizare cheltuieli pe categorii și luni' },
  { icon: '📁', text: 'Export și rapoarte lunare automate' },
  { icon: '🔒', text: 'Date securizate, acces pe roluri' },
  { icon: '☁️', text: 'Backup automat în cloud S3' },
];

const TESTIMONIAL = {
  initials: 'AM',
  name: 'Alexandru M.',
  title: 'Manager financiar, Cluj-Napoca',
  stars: 5,
  quote: '"Gestionăm cheltuielile a 3 departamente. Platforma ne-a economisit 6 ore pe săptămână în reconciliere."',
};

export default function Login({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [error, setError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const submitLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await onLogin(email, password);
    } catch (ex) {
      setError(ex?.response?.data?.message || 'Autentificare eșuată');
    }
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!agreeTerms) { setError('Trebuie să accepți Termenii și Condițiile'); return; }
    if (registerForm.password !== registerForm.passwordConfirmation) { setError('Parolele nu coincid'); return; }
    try {
      await onRegister(registerForm);
      setRegisterForm(emptyRegisterForm);
      setAgreeTerms(false);
    } catch (ex) {
      setError(ex?.response?.data?.message || 'Nu am putut crea contul');
    }
  };

  const switchMode = (m) => { setError(''); setMode(m); };

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-gradient-to-br from-[#0b1a35] to-[#0d2352] px-14 py-12 text-white">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white font-bold text-sm">EX</div>
          <span className="text-[17px] font-semibold tracking-tight">Expenses</span>
        </div>

        {/* Headline */}
        <div className="space-y-6">
          <h1 className="text-[38px] leading-tight font-extrabold">
            Controlul tău financiar,{' '}
            <span className="text-blue-400">inteligent</span>{' '}
            și simplu.
          </h1>
          <p className="text-[15px] text-slate-300 leading-relaxed max-w-sm">
            Urmărești cheltuielile, generezi rapoarte și nu mai ratezi niciun termen limită bugetar.
          </p>

          <ul className="space-y-3 pt-2">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-[14px] text-slate-200">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[15px]">{f.icon}</span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        {/* Testimonial */}
        <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-[13px] font-bold text-white">
              {TESTIMONIAL.initials}
            </div>
            <div>
              <p className="text-[13px] font-semibold">{TESTIMONIAL.name}</p>
              <p className="text-[11px] text-slate-400">{TESTIMONIAL.title}</p>
            </div>
            <div className="ml-auto text-yellow-400 text-[13px]">{'★'.repeat(TESTIMONIAL.stars)}</div>
          </div>
          <p className="text-[13px] text-slate-300 leading-relaxed">{TESTIMONIAL.quote}</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Pill tabs */}
        <div className="mb-8 flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`rounded-full px-6 py-2 text-[14px] font-semibold transition ${mode === 'login' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`rounded-full px-6 py-2 text-[14px] font-semibold transition ${mode === 'register' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Create Account
          </button>
        </div>

        {/* Card */}
        <div className="w-full max-w-[400px] rounded-2xl bg-white px-8 py-8 shadow-md">
          {mode === 'login' ? (
            <>
              <h2 className="text-[22px] font-bold text-slate-900">Welcome back</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">Sign in to your Expenses account</p>

              <form className="mt-6 space-y-4" onSubmit={submitLogin}>
                <div>
                  <label className="block text-[13px] font-medium text-slate-700 mb-1">Email address</label>
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplu.com"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[14px] text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:bg-white transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[13px] font-medium text-slate-700">Password</label>
                    <button type="button" tabIndex={-1} className="text-[12px] text-blue-600 hover:underline">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-[14px] text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && <p className="text-[13px] text-red-600">{error}</p>}

                <button
                  type="submit"
                  className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-[14px] font-semibold text-white hover:bg-blue-700 transition"
                >
                  Sign In
                </button>

                <p className="text-center text-[13px] text-slate-500">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => switchMode('register')} className="font-semibold text-blue-600 hover:underline">
                    Create one
                  </button>
                </p>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-[22px] font-bold text-slate-900">Create account</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">Înregistrează-te pentru acces la platformă</p>

              <form className="mt-6 space-y-4" onSubmit={submitRegister}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-medium text-slate-700 mb-1">Prenume</label>
                    <input
                      required
                      value={registerForm.firstName}
                      onChange={(e) => setRegisterForm((p) => ({ ...p, firstName: e.target.value }))}
                      placeholder="Ion"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[14px] text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-slate-700 mb-1">Nume</label>
                    <input
                      required
                      value={registerForm.lastName}
                      onChange={(e) => setRegisterForm((p) => ({ ...p, lastName: e.target.value }))}
                      placeholder="Popescu"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[14px] text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-slate-700 mb-1">Email address</label>
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="email@exemplu.com"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[14px] text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      minLength={6}
                      required
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="min. 6 caractere"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-[14px] text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:bg-white transition"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowRegisterPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showRegisterPassword ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-slate-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    value={registerForm.passwordConfirmation}
                    onChange={(e) => setRegisterForm((p) => ({ ...p, passwordConfirmation: e.target.value }))}
                    placeholder="repetă parola"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[14px] text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:bg-white transition"
                  />
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-[12px] text-slate-600 leading-relaxed">
                    Sunt de acord cu <a href="#" className="text-blue-600 hover:underline">Termenii și Condițiile</a>
                  </label>
                </div>

                {error && <p className="text-[13px] text-red-600">{error}</p>}

                <button
                  type="submit"
                  className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-[14px] font-semibold text-white hover:bg-blue-700 transition"
                >
                  Create Account
                </button>

                <p className="text-center text-[13px] text-slate-500">
                  Ai deja cont?{' '}
                  <button type="button" onClick={() => switchMode('login')} className="font-semibold text-blue-600 hover:underline">
                    Sign In
                  </button>
                </p>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-[12px] text-slate-400">
          By continuing, you agree to our{' '}
          <a href="#" className="hover:underline">Terms of Service</a>{' '}
          and{' '}
          <a href="#" className="hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

