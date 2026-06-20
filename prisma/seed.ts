import { PrismaClient } from '@prisma/client';
import { seedLocations } from './seeds/locations.seed';

const prisma = new PrismaClient();

const roles = [
  ['admin', 'Administrator', 'Full platform administration'],
  ['provider', 'Provider', 'Delivery service provider'],
] as const;

async function main() {
  for (const [code, name, description] of roles) {
    await prisma.role.upsert({
      where: { code },
      update: { name, description },
      create: { code, name, description },
    });
  }
  console.log('✓ Roles seeded');

  await seedLocations(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
