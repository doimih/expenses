import { useState } from 'react';

const emptyRegisterForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  passwordConfirmation: '',
};

function SpacerIcon() {
  return (
    <svg className="h-20 w-20 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
    </svg>
  );
}

export default function Login({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('demo@expenses.com');
  const [password, setPassword] = useState('password');
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [error, setError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const submitLogin = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await onLogin(email, password);
    } catch (e) {
      setError(e?.response?.data?.message || 'Login failed');
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    setError('');

    if (!agreeTerms) {
      setError('Trebuie să accepți Termenii și Condițiile');
      return;
    }

    try {
      await onRegister(registerForm);
      setRegisterForm(emptyRegisterForm);
      setAgreeTerms(false);
    } catch (e) {
      setError(e?.response?.data?.message || 'Nu am putut crea contul');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[600px]">
          <div className="hidden md:flex flex-col justify-center bg-gradient-to-br from-blue-700 to-blue-900 px-12 py-12 text-white">
            <div>
              <p className="text-sm font-medium opacity-90">Welcome to</p>
              <div className="mt-8 flex justify-center">
                <SpacerIcon />
              </div>
              <h2 className="mt-8 text-center text-3xl font-bold">Expenses</h2>
            </div>
          </div>

          <div className="flex flex-col justify-center bg-white px-8 py-12 sm:px-12">
            {mode === 'register' ? (
              <>
                <h1 className="text-3xl font-bold text-slate-900">Create your account</h1>

                <form className="mt-8 space-y-4" onSubmit={submitRegister}>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input
                      className="w-full rounded-lg border-b-2 border-blue-300 bg-transparent px-0 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                      placeholder="Enter your full name"
                      value={`${registerForm.firstName} ${registerForm.lastName}`.trim()}
                      onChange={(event) => {
                        const parts = event.target.value.split(' ');
                        setRegisterForm((prev) => ({
                          ...prev,
                          firstName: parts[0] || '',
                          lastName: parts.slice(1).join(' ') || '',
                        }));
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-mail Address</label>
                    <input
                      className="w-full rounded-lg border-b-2 border-blue-300 bg-transparent px-0 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                      type="email"
                      placeholder="Enter your email"
                      value={registerForm.email}
                      onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input
                      className="w-full rounded-lg border-b-2 border-blue-300 bg-transparent px-0 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                      type="password"
                      placeholder="Enter your password"
                      value={registerForm.password}
                      onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
                      minLength={6}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                    <input
                      className="w-full rounded-lg border-b-2 border-blue-300 bg-transparent px-0 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                      type="password"
                      placeholder="Confirm your password"
                      value={registerForm.passwordConfirmation}
                      onChange={(event) => setRegisterForm((prev) => ({ ...prev, passwordConfirmation: event.target.value }))}
                      minLength={6}
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-sm text-slate-600">
                      By signing up I agree with <a href="#" className="text-blue-600 hover:underline">Terms & Conditions</a>
                    </label>
                  </div>

                  {error && <p className="text-sm text-red-600 pt-2">{error}</p>}

                  <div className="flex gap-3 pt-6">
                    <button className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition" type="submit">
                      Sign Up
                    </button>
                    <button
                      className="flex-1 rounded-lg border-2 border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition"
                      type="button"
                      onClick={() => {
                        setError('');
                        setMode('login');
                      }}
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-slate-900">Sign in to your account</h1>

                <form className="mt-8 space-y-4" onSubmit={submitLogin}>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-mail Address</label>
                    <input
                      className="w-full rounded-lg border-b-2 border-blue-300 bg-transparent px-0 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input
                      className="w-full rounded-lg border-b-2 border-blue-300 bg-transparent px-0 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input id="remember" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    <label htmlFor="remember" className="text-sm text-slate-600">Remember me</label>
                  </div>

                  {error && <p className="text-sm text-red-600 pt-2">{error}</p>}

                  <div className="flex gap-3 pt-6">
                    <button className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition" type="submit">
                      Sign In
                    </button>
                    <button
                      className="flex-1 rounded-lg border-2 border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition"
                      type="button"
                      onClick={() => {
                        setError('');
                        setMode('register');
                      }}
                    >
                      Sign Up
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

