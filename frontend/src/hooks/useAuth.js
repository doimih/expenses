import { useEffect, useState } from 'react';
import api from '../services/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    api.get('/auth/me')
      .then(({ data }) => setUser(data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', {
      email,
      password,
      device_name: 'pwa-ios',
    });

    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const register = async ({ firstName, lastName, email, password, passwordConfirmation }) => {
    const { data } = await api.post('/auth/register', {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      password_confirmation: passwordConfirmation,
      device_name: 'pwa-ios',
    });

    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  return { user, loading, login, register, logout };
}
