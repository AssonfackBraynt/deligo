import { Reflector } from '@nestjs/core';
import { RoleCode } from '@common/enums/role-code.enum';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  it('allows users with at least one required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([RoleCode.Admin]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            roles: [RoleCode.Admin],
          },
        }),
      }),
    };

    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('blocks users without required roles', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([RoleCode.Admin]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            roles: [RoleCode.Provider],
          },
        }),
      }),
    };

    expect(guard.canActivate(context as any)).toBe(false);
  });
});
