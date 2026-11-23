import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'Password123!';
const DM_MESSAGE_COUNT = 40;
const DM_SPAN_DAYS = 4;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const SEED_USERS = [
  { key: 'alice', displayName: 'Alice Wanjiru' },
  { key: 'bob', displayName: 'Bob Otieno' },
  { key: 'carol', displayName: 'Carol Njeri' },
  { key: 'dave', displayName: 'Dave Mwangi' },
];

const DM_LINES = [
  'Morning! Did you see the new claim from Westlands?',
  'Yes, reviewing it now.',
  'The photos look consistent with the report.',
  'Agreed. Any red flags on the policy?',
  'Premium was paid late last month, checking the grace period.',
  'Grace period covers it.',
  'Great, I will draft the assessment.',
  'Send it over when ready.',
];

const GROUP_LINES = [
  { sender: 'alice', body: 'Welcome to the Claims Team channel 👋' },
  { sender: 'bob', body: 'Thanks Alice! Glad to be here.' },
  { sender: 'carol', body: 'Weekly backlog review is Friday at 10.' },
  { sender: 'alice', body: 'Perfect, please bring your open cases.' },
];

const directKeyFor = (userIdA, userIdB) => [userIdA, userIdB].sort().join(':');

const upsertUsers = async (passwordHash) => {
  const entries = await Promise.all(
    SEED_USERS.map(async ({ key, displayName }) => {
      const email = `${key}@cic.test`;
      const user = await prisma.user.upsert({
        where: { email },
        update: { displayName, passwordHash },
        create: { email, displayName, passwordHash },
      });
      return [key, user];
    }),
  );
  return Object.fromEntries(entries);
};

/** Removes conversations created by seed users so the seed can be re-run. */
const clearSeedConversations = (users) =>
  prisma.conversation.deleteMany({
    where: { createdById: { in: Object.values(users).map((user) => user.id) } },
  });

const buildDmMessages = (alice, bob) => {
  const start = Date.now() - DM_SPAN_DAYS * MS_PER_DAY;
  const step = (DM_SPAN_DAYS * MS_PER_DAY) / DM_MESSAGE_COUNT;

  return Array.from({ length: DM_MESSAGE_COUNT }, (_, index) => ({
    senderId: index % 2 === 0 ? alice.id : bob.id,
    body: DM_LINES[index % DM_LINES.length],
    clientMsgId: randomUUID(),
    createdAt: new Date(start + index * step),
  }));
};

const buildGroupMessages = (users) => {
  const start = Date.now() - 2 * 60 * 60 * 1000;

  return GROUP_LINES.map(({ sender, body }, index) => ({
    senderId: users[sender].id,
    body,
    clientMsgId: randomUUID(),
    createdAt: new Date(start + index * 10 * 60 * 1000),
  }));
};

const lastCreatedAt = (messages) => messages.at(-1).createdAt;

const seedDirectConversation = ({ alice, bob }) => {
  const messages = buildDmMessages(alice, bob);

  return prisma.conversation.create({
    data: {
      type: 'direct',
      directKey: directKeyFor(alice.id, bob.id),
      createdById: alice.id,
      lastMessageAt: lastCreatedAt(messages),
      members: {
        create: [
          { userId: alice.id, role: 'member' },
          { userId: bob.id, role: 'member' },
        ],
      },
      messages: { create: messages },
    },
  });
};

const seedGroupConversation = (users) => {
  const messages = buildGroupMessages(users);

  return prisma.conversation.create({
    data: {
      type: 'group',
      name: 'Claims Team',
      createdById: users.alice.id,
      lastMessageAt: lastCreatedAt(messages),
      members: {
        create: [
          { userId: users.alice.id, role: 'owner' },
          { userId: users.bob.id, role: 'member' },
          { userId: users.carol.id, role: 'member' },
        ],
      },
      messages: { create: messages },
    },
  });
};

const main = async () => {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const users = await upsertUsers(passwordHash);

  await clearSeedConversations(users);
  await seedDirectConversation(users);
  await seedGroupConversation(users);

  console.log(`Seeded ${SEED_USERS.length} users, 1 direct chat, 1 group chat.`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
