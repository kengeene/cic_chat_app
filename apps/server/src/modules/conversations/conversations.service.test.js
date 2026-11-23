import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDirectKey, createConversationsService } from './conversations.service.js';

const ALICE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BOB_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const userRecord = (id, displayName) => ({ id, email: `${displayName}@cic.test`, displayName, passwordHash: 'bcrypt-hash', lastSeenAt: null });

const directConversation = (id) => ({
  id,
  type: 'direct',
  name: null,
  createdAt: new Date('2026-01-01T10:00:00Z'),
  lastMessageAt: null,
  members: [
    { role: 'member', user: userRecord(ALICE_ID, 'alice') },
    { role: 'member', user: userRecord(BOB_ID, 'bob') },
  ],
});

/** Repository fake that remembers created direct chats, like the database's unique directKey would. */
const createConversationsRepositoryFake = () => {
  const byDirectKey = new Map();
  return {
    findByDirectKey: vi.fn(async (directKey) => byDirectKey.get(directKey) ?? null),
    createDirect: vi.fn(async ({ directKey }) => {
      const conversation = directConversation(`conversation-${byDirectKey.size + 1}`);
      byDirectKey.set(directKey, conversation);
      return conversation;
    }),
  };
};

describe('conversationsService.findOrCreateDirect', () => {
  let conversationsRepository;
  let notifyConversationCreated;
  let conversationsService;

  beforeEach(() => {
    conversationsRepository = createConversationsRepositoryFake();
    notifyConversationCreated = vi.fn();
    conversationsService = createConversationsService({
      conversationsRepository,
      messagesRepository: {
        findLatestPerConversation: vi.fn().mockResolvedValue(new Map()),
        countUnreadPerConversation: vi.fn().mockResolvedValue(new Map()),
      },
      usersRepository: { countByIds: vi.fn(async (ids) => ids.length) },
      presence: { isOnline: () => false },
      notifyConversationCreated,
    });
  });

  it('creates the direct chat once and returns the same one on later calls from either side', async () => {
    const first = await conversationsService.findOrCreateDirect(ALICE_ID, BOB_ID);
    const second = await conversationsService.findOrCreateDirect(ALICE_ID, BOB_ID);
    const fromBob = await conversationsService.findOrCreateDirect(BOB_ID, ALICE_ID);

    expect(conversationsRepository.createDirect).toHaveBeenCalledTimes(1);
    expect(second.id).toBe(first.id);
    expect(fromBob.id).toBe(first.id);
    expect(notifyConversationCreated).toHaveBeenCalledTimes(1);
  });

  it('uses an order-independent direct key', () => {
    expect(buildDirectKey(ALICE_ID, BOB_ID)).toBe(buildDirectKey(BOB_ID, ALICE_ID));
  });

  it('never exposes password hashes in the returned members', async () => {
    const conversation = await conversationsService.findOrCreateDirect(ALICE_ID, BOB_ID);

    conversation.members.forEach((member) => expect(member).not.toHaveProperty('passwordHash'));
  });

  it('rejects a direct chat with yourself', async () => {
    await expect(conversationsService.findOrCreateDirect(ALICE_ID, ALICE_ID)).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_DIRECT_CHAT',
    });
    expect(conversationsRepository.createDirect).not.toHaveBeenCalled();
  });
});
