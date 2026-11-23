'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal, MultiSelect, SegmentedControl, Select, Stack, TextInput } from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import { useCreateDirectConversation, useCreateGroupConversation } from '@/hooks/useConversations';
import { useDirectoryOptions } from '@/hooks/useDirectoryOptions';

const MIN_OTHER_MEMBERS = 2;
const MODES = [
  { value: 'direct', label: 'Direct message' },
  { value: 'group', label: 'Group' },
];

function DirectChatForm({ onCreated }) {
  const options = useDirectoryOptions();
  const createDirect = useCreateDirectConversation();

  return (
    <Select
      label="Person"
      placeholder="Search by name or email"
      data={options}
      searchable
      nothingFoundMessage="No people found"
      disabled={createDirect.isPending}
      onChange={(userId) => userId && createDirect.mutate({ userId }, { onSuccess: onCreated })}
    />
  );
}

function GroupChatForm({ onCreated }) {
  const options = useDirectoryOptions();
  const createGroup = useCreateGroupConversation();
  const form = useForm({
    initialValues: { name: '', memberIds: [] },
    validate: {
      name: isNotEmpty('Name the group'),
      memberIds: (ids) => (ids.length < MIN_OTHER_MEMBERS ? `Choose at least ${MIN_OTHER_MEMBERS} people` : null),
    },
  });

  const handleSubmit = ({ name, memberIds }) =>
    createGroup.mutate({ name: name.trim(), memberIds }, { onSuccess: onCreated });

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <MultiSelect
          label="Members"
          placeholder="Search by name or email"
          data={options}
          searchable
          nothingFoundMessage="No people found"
          {...form.getInputProps('memberIds')}
        />
        <TextInput label="Group name" maxLength={80} {...form.getInputProps('name')} />
        <Button type="submit" loading={createGroup.isPending}>
          Create group
        </Button>
      </Stack>
    </form>
  );
}

export function NewChatModal({ opened, onClose }) {
  const router = useRouter();
  const [mode, setMode] = useState('direct');

  const openConversation = (conversation) => {
    onClose();
    router.push(`/chat/${conversation.id}`);
  };

  return (
    <Modal opened={opened} onClose={onClose} title="New chat">
      <SegmentedControl fullWidth data={MODES} value={mode} onChange={setMode} mb="md" aria-label="Chat type" />
      {mode === 'direct' ? <DirectChatForm onCreated={openConversation} /> : <GroupChatForm onCreated={openConversation} />}
    </Modal>
  );
}
