'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const COPY = {
  login: { title: 'Sign in', submit: 'Sign in', switchPrompt: 'New here?', switchAction: 'Create an account' },
  register: { title: 'Create account', submit: 'Create account', switchPrompt: 'Already have an account?', switchAction: 'Sign in' },
};

export function AuthForm() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegister = mode === 'register';
  const copy = COPY[mode];

  const handleSubmit = async (event) => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setError(null);
    setIsSubmitting(true);
    try {
      await (isRegister ? register(fields) : login(fields));
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setError(null);
    setMode(isRegister ? 'login' : 'register');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">{copy.title}</h1>
      {isRegister && <Input label="Full name" name="displayName" autoComplete="name" required maxLength={80} />}
      <Input label="Work email" name="email" type="email" autoComplete="email" required />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete={isRegister ? 'new-password' : 'current-password'}
        minLength={isRegister ? 8 : undefined}
        required
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Please wait…' : copy.submit}
      </Button>
      <p className="text-center text-sm text-slate-600">
        {copy.switchPrompt}{' '}
        <button type="button" onClick={toggleMode} className="font-medium text-accent hover:underline">
          {copy.switchAction}
        </button>
      </p>
    </form>
  );
}
