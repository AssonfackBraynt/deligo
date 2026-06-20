/**
 * Run with: npx ts-node prisma/seed-admin.ts
 * Creates the admin role and first admin user if they don't exist.
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // 1. Ensure admin role exists
  let adminRole = await prisma.role.findFirst({ where: { code: 'admin' } });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { code: 'admin', name: 'Administrator', description: 'Full access to DeliGo admin portal.' },
    });
    console.log('✅ Created admin role');
  } else {
    console.log('ℹ️  Admin role already exists');
  }

  // 2. Ensure provider role exists
  let providerRole = await prisma.role.findFirst({ where: { code: 'provider' } });
  if (!providerRole) {
    providerRole = await prisma.role.create({
      data: { code: 'provider', name: 'Provider', description: 'Delivery provider (rider or company).' },
    });
    console.log('✅ Created provider role');
  } else {
    console.log('ℹ️  Provider role already exists');
  }

  // 3. Create first admin user
  const ADMIN_PHONE = '+237694374748';
  const ADMIN_EMAIL = 'admin@deligo.cm';
  const ADMIN_PASSWORD = 'Admin@DeliGo2026!';

  const existing = await prisma.user.findFirst({ where: { OR: [{ phone: ADMIN_PHONE }, { email: ADMIN_EMAIL }] } });
  if (existing) {
    console.log(`ℹ️  Admin user already exists (${existing.phone})`);
  } else {
    const passwordHash = await argon2.hash(ADMIN_PASSWORD);
    const adminUser = await prisma.user.create({
      data: {
        fullName: 'DeliGo Admin',
        phone: ADMIN_PHONE,
        email: ADMIN_EMAIL,
        passwordHash,
        accountStatus: 'active',
        phoneVerifiedAt: new Date(),
        roles: {
          create: { roleId: adminRole.id },
        },
      },
    });
    console.log(`✅ Created admin user: ${adminUser.phone} / ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('   ⚠️  Change this password immediately after first login!');
  }

  console.log('\nDone.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
