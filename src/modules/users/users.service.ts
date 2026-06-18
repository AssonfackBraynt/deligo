import { Injectable } from '@nestjs/common';
import { AccountStatus } from '@common/enums/account-status.enum';
import { RoleCode } from '@common/enums/role-code.enum';
import { PrismaService } from '@database/prisma.service';

export type UserWithRoles = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  passwordHash: string | null;
  accountStatus: AccountStatus;
  roles: RoleCode[];
  agencyIds: string[];
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAuthUserByEmail(email: string): Promise<UserWithRoles | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          where: { deletedAt: null },
          include: { role: true },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      passwordHash: user.passwordHash,
      accountStatus: user.accountStatus as AccountStatus,
      roles: user.roles.map((userRole) => userRole.role.code as RoleCode),
      agencyIds: user.roles
        .map((userRole) => userRole.agencyId)
        .filter((agencyId): agencyId is string => Boolean(agencyId)),
    };
  }

  async findAuthUserByPhone(phone: string): Promise<UserWithRoles | null> {
    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: {
        roles: {
          where: { deletedAt: null },
          include: { role: true },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      passwordHash: user.passwordHash,
      accountStatus: user.accountStatus as AccountStatus,
      roles: user.roles.map((userRole) => userRole.role.code as RoleCode),
      agencyIds: user.roles
        .map((userRole) => userRole.agencyId)
        .filter((agencyId): agencyId is string => Boolean(agencyId)),
    };
  }

  async findAuthUserById(id: string): Promise<UserWithRoles | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          where: { deletedAt: null },
          include: { role: true },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      passwordHash: user.passwordHash,
      accountStatus: user.accountStatus as AccountStatus,
      roles: user.roles.map((userRole) => userRole.role.code as RoleCode),
      agencyIds: user.roles
        .map((userRole) => userRole.agencyId)
        .filter((agencyId): agencyId is string => Boolean(agencyId)),
    };
  }

  async createUserWithRole(input: {
    fullName: string;
    phone: string;
    email?: string;
    passwordHash: string;
    role: RoleCode;
  }): Promise<UserWithRoles> {
    const role = await this.prisma.role.findUniqueOrThrow({
      where: { code: input.role },
    });

    const user = await this.prisma.user.create({
      data: {
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        passwordHash: input.passwordHash,
        accountStatus: AccountStatus.Active,
        roles: {
          create: {
            roleId: role.id,
          },
        },
      },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      passwordHash: user.passwordHash,
      accountStatus: user.accountStatus as AccountStatus,
      roles: user.roles.map((userRole) => userRole.role.code as RoleCode),
      agencyIds: [],
    };
  }
}
