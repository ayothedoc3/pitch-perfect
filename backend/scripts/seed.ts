import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Args = {
  count: number;
  start: number;
  emailPrefix: string;
  domain: string;
  password: string;
  namePrefix: string;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
  const arg = (name: string, alias?: string) => {
    const idx = argv.findIndex(
      (a) => a === `--${name}` || (alias && a === `-${alias}`)
    );
    return idx !== -1 ? argv[idx + 1] : undefined;
  };

  const bool = (name: string) => argv.includes(`--${name}`);

  const count = parseInt(arg('count', 'n') || '10', 10);
  const start = parseInt(arg('start', 's') || '1', 10);

  return {
    count: Number.isFinite(count) && count > 0 ? count : 10,
    start: Number.isFinite(start) && start >= 0 ? start : 1,
    emailPrefix: arg('email-prefix') || 'testuser',
    domain: arg('domain') || 'example.com',
    password: arg('password') || 'Passw0rd!',
    namePrefix: arg('name-prefix') || 'Test User',
    dryRun: bool('dry-run'),
  };
}

async function main() {
  // Load env from backend/.env explicitly
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    dotenv.config();
  }

  const args = parseArgs(process.argv.slice(2));

  console.log('Seeding users with args:', {
    count: args.count,
    start: args.start,
    emailPrefix: args.emailPrefix,
    domain: args.domain,
    namePrefix: args.namePrefix,
    dryRun: args.dryRun,
  });

  // Validate DB URL presence
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Please set it in backend/.env');
    process.exit(1);
  }

  const saltRounds = 12;
  const created: { email: string; password: string }[] = [];

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

      // Upsert to be idempotent across runs
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          name,
          password: hashedPassword,
        },
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
    } catch (err: any) {
      console.error(`Failed to upsert ${email}:`, err?.message || err);
    }
  }

  console.log('\nSeed complete. Credentials:');
  created.forEach((c) => console.log(`- ${c.email} / ${c.password}`));
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
