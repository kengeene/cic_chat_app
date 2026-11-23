'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Center, Code, Paper, Stack, Text } from '@mantine/core';
import { useAuth } from '@/providers/AuthProvider';
import { AuthForm } from '@/components/auth/AuthForm';

const DEMO_EMAILS = 'alice@cic.test · bob@cic.test · carol@cic.test · dave@cic.test';

export default function LoginPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState('login');

  useEffect(() => {
    if (user) router.replace('/chat');
  }, [user, router]);

  const toggleMode = () => setMode((current) => (current === 'login' ? 'register' : 'login'));

  return (
    <Center mih="100dvh" p="md" bg="gray.0">
      <Paper withBorder shadow="sm" p="xl" w="100%" maw={400}>
        <Stack>
          <Text size="sm" fw={700} c="indigo">
            CIC Chat
          </Text>
          <AuthForm key={mode} mode={mode} onToggleMode={toggleMode} />
          <Alert variant="light" color="gray" title="Demo accounts">
            {DEMO_EMAILS}
            <br />
            Password: <Code>Password123!</Code>
          </Alert>
        </Stack>
      </Paper>
    </Center>
  );
}
