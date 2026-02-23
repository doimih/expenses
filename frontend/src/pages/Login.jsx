import { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('demo@expenses.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await onLogin(email, password);
    } catch (e) {
      setError(e?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form className="card w-full max-w-md space-y-4" onSubmit={submit}>
        <h1 className="text-2xl font-bold">Login</h1>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button className="btn w-full" type="submit">Sign in</button>
      </form>
    </div>
  );
}
