import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { AccountStatus } from '@common/enums/account-status.enum';
import { RoleCode } from '@common/enums/role-code.enum';
import { UsersService, UserWithRoles } from '@modules/users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, 'findAuthUserByPhone' | 'findAuthUserById' | 'createUserWithRole'>>;

  const user: UserWithRoles = {
    id: 'user-id',
    fullName: 'John Carrier',
    phone: '+237600000000',
    email: 'john@example.com',
    passwordHash: 'hash',
    accountStatus: AccountStatus.Active,
    roles: [RoleCode.Carrier],
    agencyIds: [],
  };

  beforeEach(() => {
    usersService = {
      findAuthUserByPhone: jest.fn(),
      findAuthUserById: jest.fn(),
      createUserWithRole: jest.fn(),
    };

    service = new AuthService(
      usersService as UsersService,
      {
        signAsync: jest.fn().mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token'),
        verifyAsync: jest.fn(),
      } as unknown as JwtService,
      {
        getOrThrow: jest.fn((key: string) => {
          const values: Record<string, string> = {
            'auth.accessSecret': 'access-secret',
            'auth.refreshSecret': 'refresh-secret',
            'auth.accessExpiresIn': '15m',
            'auth.refreshExpiresIn': '30d',
          };
          return values[key];
        }),
      } as unknown as ConfigService,
    );
  });

  it('returns tokens on valid login', async () => {
    usersService.findAuthUserByPhone.mockResolvedValue(user);
    jest.spyOn(argon2, 'verify').mockResolvedValue(true);

    const result = await service.login({
      phone: '+237600000000',
      password: 'StrongPassword123!',
    });

    expect(result.tokens.accessToken).toBe('access-token');
    expect(result.tokens.refreshToken).toBe('refresh-token');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejects invalid credentials', async () => {
    usersService.findAuthUserByPhone.mockResolvedValue(null);

    await expect(
      service.login({
        phone: '+237600000000',
        password: 'StrongPassword123!',
      }),
    ).rejects.toMatchObject({ status: 401 });
  });
});
