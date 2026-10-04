import { prisma } from '../lib/db';
import { hashPassword } from '@flaredev/core';

async function main() {
  console.log('Seeding database with 1 year of data...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.dependency.deleteMany();
  await prisma.component.deleteMany();
  await prisma.decision.deleteMany();

  const user = await prisma.user.upsert({
    where: { email: 'demo@archledger.com' },
    update: {},
    create: {
      email: 'demo@archledger.com',
      name: 'Demo User',
      role: 'admin',
    },
  });

  const hashed = await hashPassword('Password123!');
  
  // Clean existing credential accounts for this user to avoid duplicates
  await prisma.account.deleteMany({
    where: { userId: user.id, providerId: 'credential' }
  });

  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: 'credential',
      password: hashed,
    }
  });

  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  function randomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  // Create 50 components
  const componentNames = [
    'Auth Service', 'User Service', 'Billing API', 'Payment Gateway', 'Notification Hub', 
    'Email Worker', 'Search Indexer', 'Search API', 'Main Database', 'Analytics DB',
    'Redis Cache', 'CDN', 'Web Frontend', 'Mobile App', 'Admin Dashboard',
    'Inventory Service', 'Order Processor', 'Shipping API', 'Recommendation Engine', 'Kafka Cluster',
    'Image Optimizer', 'Video Transcoder', 'Metrics Aggregator', 'Log Shipper', 'SSO Provider',
    'CRM Sync', 'ERP Connector', 'Legacy Mainframe', 'Pricing Engine', 'Fraud Detection',
    'Document Store', 'Blob Storage', 'API Gateway', 'Load Balancer', 'DNS Manager',
    'CI/CD Pipeline', 'Feature Flag Service', 'Config Server', 'Secret Manager', 'GraphQL Federation',
    'Webhook Emitter', 'WebSocket Server', 'Presence Service', 'Chat Backend', 'ML Model Serving',
    'Data Lake', 'ETL Pipeline', 'Reporting UI', 'Internal Tools API', 'Job Scheduler'
  ];

  const components = [];
  for (let i = 0; i < componentNames.length; i++) {
    const cDate = randomDate(oneYearAgo, now);
    const c = await prisma.component.create({
      data: {
        name: componentNames[i],
        description: `Microservice for ${componentNames[i].toLowerCase()}`,
        tags: i % 2 === 0 ? 'backend,node' : 'infrastructure',
        lifecycleStage: i % 5 === 0 ? 'deprecated' : (i % 3 === 0 ? 'beta' : 'production'),
        createdAt: cDate,
        updatedAt: new Date(cDate.getTime() + 10000000)
      },
    });
    components.push(c);

    // Audit log for component creation
    await prisma.auditLog.create({
      data: {
        action: 'create',
        resource: 'Component',
        recordId: c.id,
        recordLabel: c.name,
        userId: user.id,
        userEmail: user.email,
        createdAt: cDate
      }
    });
  }

  // Create dependencies to form a realistic complex graph
  for (let i = 0; i < components.length; i++) {
    const source = components[i];
    // Each component depends on 1 to 3 others randomly, mostly pointing "downwards" to infrastructure
    const numDeps = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numDeps; j++) {
      const targetIndex = Math.floor(Math.random() * components.length);
      if (targetIndex !== i) {
        const target = components[targetIndex];
        const dDate = randomDate(source.createdAt, now);
        await prisma.dependency.create({
          data: {
            sourceId: source.id,
            targetId: target.id,
            type: Math.random() > 0.5 ? 'api-call' : 'database-query',
            createdAt: dDate,
            updatedAt: dDate
          }
        });
      }
    }
  }

  // Create 30 Architecture Decisions (ADRs) spread over the year
  for (let i = 0; i < 30; i++) {
    const dDate = randomDate(oneYearAgo, now);
    const d = await prisma.decision.create({
      data: {
        title: `ADR-${i + 1}: ${['Adopt', 'Migrate to', 'Deprecate', 'Evaluate'][i % 4]} ${components[i % components.length].name}`,
        body: `# Context\nWe need to scale our system.\n\n# Decision\nWe decided to take action on ${components[i % components.length].name}.\n\n# Consequences\nBetter performance.`,
        state: i % 10 === 0 ? 'rejected' : (i % 5 === 0 ? 'proposed' : 'accepted'),
        tags: 'architecture,scale',
        createdAt: dDate,
        updatedAt: dDate
      }
    });

    // Audit log for decision
    await prisma.auditLog.create({
      data: {
        action: 'create',
        resource: 'Decision',
        recordId: d.id,
        recordLabel: d.title,
        userId: user.id,
        userEmail: user.email,
        createdAt: dDate
      }
    });
  }

  console.log('Created 50 components, random dependencies, 30 ADRs, and 1 year of audit logs.');
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
