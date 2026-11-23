'use client';

import { useState } from 'react';
import { Alert, Anchor, Button, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { hasLength, isEmail, isNotEmpty, useForm } from '@mantine/form';
import { useAuth } from '@/providers/AuthProvider';

const MODES = {
  login: {
    title: 'Sign in',
    switchPrompt: 'New here?',
    switchAction: 'Create an account',
    validate: { email: isEmail('Enter a valid email'), password: isNotEmpty('Enter your password') },
  },
  register: {
    title: 'Create account',
    switchPrompt: 'Already have an account?',
    switchAction: 'Sign in',
    validate: {
      displayName: isNotEmpty('Enter your name'),
      email: isEmail('Enter a valid email'),
      password: hasLength({ min: 8 }, 'Use at least 8 characters'),
    },
  },
};

/** Remount with `key={mode}` when switching modes so the form picks up that mode's rules. */
export function AuthForm({ mode, onToggleMode }) {
  const { login, register } = useAuth();
  const [error, setError] = useState(null);
  const isRegister = mode === 'register';
  const config = MODES[mode];
  const form = useForm({ initialValues: { displayName: '', email: '', password: '' }, validate: config.validate });

  const handleSubmit = async ({ displayName, email, password }) => {
    setError(null);
    try {
      await (isRegister ? register({ displayName, email, password }) : login({ email, password }));
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <Title order={1} size="h3">
          {config.title}
        </Title>
        {isRegister && <TextInput label="Full name" autoComplete="name" maxLength={80} {...form.getInputProps('displayName')} />}
        <TextInput label="Work email" type="email" autoComplete="email" {...form.getInputProps('email')} />
        <PasswordInput
          label="Password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          {...form.getInputProps('password')}
        />
        {error && (
          <Alert color="red" role="alert">
            {error}
          </Alert>
        )}
        <Button type="submit" loading={form.submitting} fullWidth>
          {config.title}
        </Button>
        <Text size="sm" ta="center">
          {config.switchPrompt}{' '}
          <Anchor component="button" type="button" size="sm" onClick={onToggleMode}>
            {config.switchAction}
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
}
