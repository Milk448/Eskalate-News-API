import { PrismaClient, Role, ArticleStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.dailyAnalytics.deleteMany();
  await prisma.readLog.deleteMany();
  await prisma.article.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Cleared existing data');

  // Create users
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const author1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      role: Role.author,
    },
  });

  const author2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: hashedPassword,
      role: Role.author,
    },
  });

  const reader1 = await prisma.user.create({
    data: {
      name: 'Bob Reader',
      email: 'bob@example.com',
      password: hashedPassword,
      role: Role.reader,
    },
  });

  console.log('✓ Created users');

  // Create articles
  const article1 = await prisma.article.create({
    data: {
      title: 'Getting Started with TypeScript',
      content: 'TypeScript is a powerful superset of JavaScript that adds static typing. In this comprehensive guide, we will explore the fundamentals of TypeScript and how it can improve your development workflow.',
      category: 'Tech',
      status: ArticleStatus.Published,
      authorId: author1.id,
    },
  });

  const article2 = await prisma.article.create({
    data: {
      title: 'The Future of Web Development',
      content: 'Web development is constantly evolving with new frameworks, tools, and best practices emerging regularly. This article explores the trends shaping the future of web development and what developers should focus on.',
      category: 'Tech',
      status: ArticleStatus.Published,
      authorId: author1.id,
    },
  });

  const article3 = await prisma.article.create({
    data: {
      title: 'Healthy Living Tips for Developers',
      content: 'As developers, we often spend long hours sitting at our desks. This article provides practical tips for maintaining a healthy lifestyle while working in tech, including exercise routines and nutrition advice.',
      category: 'Health',
      status: ArticleStatus.Published,
      authorId: author2.id,
    },
  });

  const article4 = await prisma.article.create({
    data: {
      title: 'Draft Article - Work in Progress',
      content: 'This is a draft article that is still being worked on. It contains preliminary content that will be expanded and refined before publication.',
      category: 'Tech',
      status: ArticleStatus.Draft,
      authorId: author2.id,
    },
  });

  console.log('✓ Created articles');

  // Create read logs
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.readLog.createMany({
    data: [
      { articleId: article1.id, readerId: reader1.id, readAt: yesterday },
      { articleId: article1.id, readerId: null, readAt: yesterday },
      { articleId: article1.id, readerId: reader1.id, readAt: now },
      { articleId: article2.id, readerId: reader1.id, readAt: yesterday },
      { articleId: article2.id, readerId: null, readAt: now },
      { articleId: article3.id, readerId: reader1.id, readAt: yesterday },
    ],
  });

  console.log('✓ Created read logs');

  console.log('🎉 Database seeded successfully!');
  console.log('\nTest credentials:');
  console.log('Author 1: john@example.com / Password123!');
  console.log('Author 2: jane@example.com / Password123!');
  console.log('Reader: bob@example.com / Password123!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
