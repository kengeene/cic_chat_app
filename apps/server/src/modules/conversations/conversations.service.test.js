import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma.js';
import { CONVERSATION_CREATED, domainEvents } from '../../lib/domainEvents.js';
import { buildDirectKey, findOrCreateDirect } from './conversations.service.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    user: { count: vi.fn() },
    conversation: { findUnique: vi.fn(), create: vi.fn() },
  },
  isUniqueViolation: (error) => error?.code === 'P2002',
}));

vi.mock('./conversations.queries.js', () => ({
  findLatestMessages: async () => new Map(),
  countUnreadMessages: async () => new Map(),
}));

const ALICE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BOB_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const member = (id, displayName) => ({ role: 'member', user: { id, email: `${displayName}@cic.test`, displayName, lastSeenAt: null } });

/** Stands in for the table: remembers direct chats by their unique directKey. */
const useInMemoryConversations = () => {
  const byDirectKey = new Map();
  prisma.conversation.findUnique.mockImplementation(async ({ where }) => byDirectKey.get(where.directKey) ?? null);
  prisma.conversation.create.mockImplementation(async ({ data }) => {
    const conversation = {
      id: `conversation-${byDirectKey.size + 1}`,
      type: data.type,
      name: null,
      createdAt: new Date('2026-01-01T10:00:00Z'),
      lastMessageAt: null,
      members: [member(ALICE_ID, 'alice'), member(BOB_ID, 'bob')],
    };
    byDirectKey.set(data.directKey, conversation);
    return conversation;
  });
};

describe('conversationsService.findOrCreateDirect', () => {
  const announced = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.user.count.mockImplementation(async ({ where }) => where.id.in.length);
    useInMemoryConversations();
    domainEvents.removeAllListeners(CONVERSATION_CREATED);
    domainEvents.on(CONVERSATION_CREATED, announced);
  });

  it('creates the direct chat once and returns the same one on later calls from either side', async () => {
    const first = await findOrCreateDirect(ALICE_ID, BOB_ID);
    const second = await findOrCreateDirect(ALICE_ID, BOB_ID);
    const fromBob = await findOrCreateDirect(BOB_ID, ALICE_ID);

    expect(prisma.conversation.create).toHaveBeenCalledTimes(1);
    expect(second.id).toBe(first.id);
    expect(fromBob.id).toBe(first.id);
    expect(announced).toHaveBeenCalledTimes(1);
  });

  it('uses an order-independent direct key', () => {
    expect(buildDirectKey(ALICE_ID, BOB_ID)).toBe(buildDirectKey(BOB_ID, ALICE_ID));
  });

  it('rejects a direct chat with yourself', async () => {
    await expect(findOrCreateDirect(ALICE_ID, ALICE_ID)).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_DIRECT_CHAT' });
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });
});
