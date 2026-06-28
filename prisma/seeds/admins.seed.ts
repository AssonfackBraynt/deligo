import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const ADMINS = [
  { email: 'admin@deligo.cm',  password: 'Admin@DeliGo2026!',  fullName: 'DeliGo Admin',  phone: '+237699100001' },
  { email: 'admin2@deligo.cm', password: 'Admin2@DeliGo2026!', fullName: 'DeliGo Admin 2', phone: '+237699100002' },
] as const;

export async function seedAdmins(prisma: PrismaClient): Promise<void> {
  const adminRole = await prisma.role.findFirst({ where: { code: 'admin' } });
  if (!adminRole) throw new Error('admin role not found — seed roles before admins');

  let created = 0;
  let skipped = 0;

  for (const admin of ADMINS) {
    const existing = await prisma.user.findFirst({
      where: { email: admin.email },
      select: { id: true },
    });

    let userId: string;
    if (existing) {
      userId = existing.id;
      skipped++;
    } else {
      const passwordHash = await argon2.hash(admin.password);
      const user = await prisma.user.create({
        data: {
          fullName: admin.fullName,
          email: admin.email,
          phone: admin.phone,
          passwordHash,
          accountStatus: 'active',
          phoneVerifiedAt: new Date(),
          emailVerifiedAt: new Date(),
        },
      });
      userId = user.id;
      created++;
    }

    // Assign admin role if not already assigned
    const existingRole = await prisma.userRole.findFirst({
      where: { userId, roleId: adminRole.id, agencyId: null },
    });
    if (!existingRole) {
      await prisma.userRole.create({
        data: { userId, roleId: adminRole.id },
      });
    }
  }

  console.log(`✓ Admins seeded — ${created} created, ${skipped} already existed`);
}
