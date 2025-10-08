/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

// Load env from backend/.env if present, otherwise from process env
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const prisma = new PrismaClient();

function parseArgs(argv) {
  const get = (name, alias) => {
    const idx = argv.findIndex((a) => a === `--${name}` || (alias && a === `-${alias}`));
    return idx !== -1 ? argv[idx + 1] : undefined;
  };
  const flag = (name) => argv.includes(`--${name}`);

  const count = parseInt(get('count', 'n') || '10', 10);
  const start = parseInt(get('start', 's') || '1', 10);

  return {
    count: Number.isFinite(count) && count > 0 ? count : 10,
    start: Number.isFinite(start) && start >= 0 ? start : 1,
    emailPrefix: get('email-prefix') || 'testuser',
    domain: get('domain') || 'example.com',
    password: get('password') || 'Passw0rd!',
    namePrefix: get('name-prefix') || 'Test User',
    dryRun: flag('dry-run'),
  };
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  console.log('Seeding users with args:', {
    count: args.count,
    start: args.start,
    emailPrefix: args.emailPrefix,
    domain: args.domain,
    namePrefix: args.namePrefix,
    dryRun: args.dryRun,
  });

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Set it in Coolify or backend/.env');
    process.exit(1);
  }

  const saltRounds = 12;
  const created = [];

  for (let i = 0; i < args.count; i++) {
    const index = args.start + i;
    const email = `${args.emailPrefix}+${index}@${args.domain}`;
    const name = `${args.namePrefix} ${index}`;

    if (args.dryRun) {
      console.log(`[dry-run] Would upsert user: ${email}`);
      continue;
    }

    try {
      const hashedPassword = await bcrypt.hash(args.password, saltRounds);
      const user = await prisma.user.upsert({
        where: { email },
        update: { name, password: hashedPassword },
        create: {
          email,
          name,
          password: hashedPassword,
          preferences: {
            create: {
              pitchType: 'Startup Pitch',
              experienceLevel: 'Beginner',
              improvementGoals: JSON.stringify([]),
              practiceFrequency: 'Weekly',
            },
          },
        },
        include: { preferences: true },
      });
      created.push({ email, password: args.password });
      console.log(`Upserted user: ${user.email}`);
    } catch (err) {
      console.error(`Failed to upsert ${email}:`, err && err.message ? err.message : err);
    }
  }

  console.log('\nSeed complete. Credentials:');
  created.forEach((c) => console.log(`- ${c.email} / ${c.password}`));
}

run()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

