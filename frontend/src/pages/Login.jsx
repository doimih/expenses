import { useState } from 'react';
import {
  IconChartPie,
  IconCloud,
  IconEye,
  IconEyeOff,
  IconFolder,
  IconLock,
  IconStarFilled,
} from '@tabler/icons-react';

const emptyRegisterForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  passwordConfirmation: '',
};

const FEATURES = [
  { icon: IconChartPie, text: 'Vizualizare cheltuieli pe categorii și luni' },
  { icon: IconFolder, text: 'Export și rapoarte lunare automate' },
  { icon: IconLock, text: 'Date securizate, acces pe roluri' },
  { icon: IconCloud, text: 'Backup automat în cloud S3' },
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
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[15px]">
                  <f.icon size={15} stroke={2} aria-hidden="true" />
                </span>
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
            <div className="ml-auto flex items-center gap-0.5 text-yellow-400 text-[13px]">
              {Array.from({ length: TESTIMONIAL.stars }, (_, index) => (
                <IconStarFilled key={`star-${index}`} size={14} aria-hidden="true" />
              ))}
            </div>
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
                        <IconEyeOff className="h-4 w-4" stroke={2} aria-hidden="true" />
                      ) : (
                        <IconEye className="h-4 w-4" stroke={2} aria-hidden="true" />
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
                        <IconEyeOff className="h-4 w-4" stroke={2} aria-hidden="true" />
                      ) : (
                        <IconEye className="h-4 w-4" stroke={2} aria-hidden="true" />
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

