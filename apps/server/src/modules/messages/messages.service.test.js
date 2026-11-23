import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMessagesService } from './messages.service.js';

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
  let messagesRepository;
  let conversationsRepository;
  let messagesService;

  beforeEach(() => {
    messagesRepository = {
      findBySenderAndClientMsgId: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(storedMessage),
    };
    conversationsRepository = {
      findMembership: vi.fn().mockResolvedValue({ conversationId: CONVERSATION_ID, userId: SENDER_ID }),
    };
    messagesService = createMessagesService({ messagesRepository, conversationsRepository });
  });

  it('rejects senders who are not members of the conversation', async () => {
    conversationsRepository.findMembership.mockResolvedValue(null);

    await expect(messagesService.send(sendInput)).rejects.toMatchObject({ statusCode: 403, code: 'NOT_A_MEMBER' });
    expect(messagesRepository.create).not.toHaveBeenCalled();
  });

  it('stores a new message with a trimmed body', async () => {
    const message = await messagesService.send(sendInput);

    expect(message).toBe(storedMessage);
    expect(messagesRepository.create).toHaveBeenCalledWith({
      conversationId: CONVERSATION_ID,
      senderId: SENDER_ID,
      body: 'Hello',
      clientMsgId: CLIENT_MSG_ID,
    });
  });

  it('is idempotent: a retry with the same clientMsgId returns the stored message without creating another', async () => {
    messagesRepository.findBySenderAndClientMsgId.mockResolvedValue(storedMessage);

    const message = await messagesService.send(sendInput);

    expect(message).toBe(storedMessage);
    expect(messagesRepository.create).not.toHaveBeenCalled();
  });

  it('returns the stored message when a concurrent retry wins the unique constraint race', async () => {
    messagesRepository.create.mockResolvedValue(null);
    messagesRepository.findBySenderAndClientMsgId.mockResolvedValueOnce(null).mockResolvedValueOnce(storedMessage);

    await expect(messagesService.send(sendInput)).resolves.toBe(storedMessage);
  });

  it('rejects an empty body after trimming', async () => {
    await expect(messagesService.send({ ...sendInput, body: '   ' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_MESSAGE_BODY',
    });
  });
});
