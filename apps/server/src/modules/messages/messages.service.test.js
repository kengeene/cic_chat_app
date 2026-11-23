import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma.js';
import { send } from './messages.service.js';

vi.mock('../../lib/prisma.js', () => {
  const prisma = {
    conversationMember: { findUnique: vi.fn() },
    message: { findUnique: vi.fn(), create: vi.fn() },
    conversation: { update: vi.fn() },
    $transaction: vi.fn((work) => work(prisma)),
  };
  return { prisma, isUniqueViolation: (error) => error?.code === 'P2002' };
});

const CONVERSATION_ID = '11111111-1111-4111-8111-111111111111';
const SENDER_ID = '22222222-2222-4222-8222-222222222222';
const CLIENT_MSG_ID = '33333333-3333-4333-8333-333333333333';

const storedMessage = {
  id: '44444444-4444-4444-8444-444444444444',
  conversationId: CONVERSATION_ID,
  senderId: SENDER_ID,
  body: 'Hello',
  clientMsgId: CLIENT_MSG_ID,
  createdAt: new Date('2026-01-01T10:00:00Z'),
};

const sendInput = { conversationId: CONVERSATION_ID, senderId: SENDER_ID, body: '  Hello  ', clientMsgId: CLIENT_MSG_ID };

describe('messagesService.send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.conversationMember.findUnique.mockResolvedValue({ conversationId: CONVERSATION_ID, userId: SENDER_ID });
    prisma.message.findUnique.mockResolvedValue(null);
    prisma.message.create.mockResolvedValue(storedMessage);
  });

  it('rejects senders who are not members of the conversation', async () => {
    prisma.conversationMember.findUnique.mockResolvedValue(null);

    await expect(send(sendInput)).rejects.toMatchObject({ statusCode: 403, code: 'NOT_A_MEMBER' });
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it('stores a new message with a trimmed body and bumps lastMessageAt', async () => {
    await expect(send(sendInput)).resolves.toBe(storedMessage);

    expect(prisma.message.create).toHaveBeenCalledWith({
      data: { conversationId: CONVERSATION_ID, senderId: SENDER_ID, body: 'Hello', clientMsgId: CLIENT_MSG_ID },
    });
    expect(prisma.conversation.update).toHaveBeenCalledWith({
      where: { id: CONVERSATION_ID },
      data: { lastMessageAt: storedMessage.createdAt },
    });
  });

  it('is idempotent: a retry with the same clientMsgId returns the stored message without creating another', async () => {
    prisma.message.findUnique.mockResolvedValue(storedMessage);

    await expect(send(sendInput)).resolves.toBe(storedMessage);
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it('returns the stored message when a concurrent retry wins the unique constraint race', async () => {
    prisma.message.create.mockRejectedValue({ code: 'P2002' });
    prisma.message.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(storedMessage);

    await expect(send(sendInput)).resolves.toBe(storedMessage);
  });

  it('rejects an empty body after trimming', async () => {
    await expect(send({ ...sendInput, body: '   ' })).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_MESSAGE_BODY' });
  });
});
