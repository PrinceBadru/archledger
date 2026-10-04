import { prisma } from '../lib/db';

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@archledger.com' },
    update: {},
    create: {
      email: 'demo@archledger.com',
      name: 'Demo User',
      role: 'admin',
    },
  });
  console.log(`Created user: ${user.email}`);

  // Clean existing components if any
  await prisma.dependency.deleteMany();
  await prisma.component.deleteMany();
  await prisma.decision.deleteMany();

  // Create demo components
  const frontend = await prisma.component.create({
    data: {
      name: 'Web Frontend',
      description: 'Next.js web application facing end-users',
      tags: 'typescript,react,frontend',
      lifecycleStage: 'production',
    },
  });

  const backend = await prisma.component.create({
    data: {
      name: 'Core API',
      description: 'Main GraphQL and REST API services',
      tags: 'node,express,backend',
      lifecycleStage: 'production',
    },
  });

  const database = await prisma.component.create({
    data: {
      name: 'Primary Database',
      description: 'PostgreSQL database storing core entity data',
      tags: 'postgres,database',
      lifecycleStage: 'production',
    },
  });
  
  const worker = await prisma.component.create({
    data: {
      name: 'Background Worker',
      description: 'Processes asynchronous queues for reports',
      tags: 'python,worker',
      lifecycleStage: 'beta',
    },
  });

  console.log('Created components');

  // Create dependencies
  await prisma.dependency.create({
    data: {
      sourceId: frontend.id,
      targetId: backend.id,
      type: 'api-call',
    },
  });

  await prisma.dependency.create({
    data: {
      sourceId: backend.id,
      targetId: database.id,
      type: 'database-query',
    },
  });

  await prisma.dependency.create({
    data: {
      sourceId: worker.id,
      targetId: database.id,
      type: 'database-query',
    },
  });

  console.log('Created dependencies');

  // Create decisions
  await prisma.decision.create({
    data: {
      title: 'Use Next.js for Web Frontend',
      body: '# Context\nWe need a robust web framework.\n\n# Decision\nWe will use Next.js with App Router.\n\n# Consequences\nBetter SEO, but steeper learning curve.',
      state: 'accepted',
      tags: 'frontend,architecture',
    },
  });

  await prisma.decision.create({
    data: {
      title: 'Migrate to PostgreSQL',
      body: '# Context\nOur old NoSQL database lacks transactions.\n\n# Decision\nMigrate core data to PostgreSQL 15.\n\n# Consequences\nStrong ACID compliance.',
      state: 'accepted',
      tags: 'database',
    },
  });

  console.log('Created decisions');
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
