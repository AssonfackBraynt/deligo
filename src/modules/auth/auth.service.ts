import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { AccountStatus } from '@common/enums/account-status.enum';
import { ErrorCode } from '@common/errors/error-codes';
import { JwtPayload } from '@common/types/jwt-payload.type';
import { UsersService, UserWithRoles } from '@modules/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export type AuthResult = {
  user: Omit<UserWithRoles, 'passwordHash'>;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const passwordHash = await argon2.hash(dto.password);

    try {
      const user = await this.usersService.createUserWithRole({
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        role: dto.role,
      });

      return this.buildAuthResult(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({
          success: false,
          error: {
            code: ErrorCode.Conflict,
            message: 'A user with this phone or email already exists.',
          },
        });
      }

      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('email or phone is required');
    }

    const user = dto.email
      ? await this.usersService.findAuthUserByEmail(dto.email)
      : await this.usersService.findAuthUserByPhone(dto.phone!);

    if (!user?.passwordHash) {
      throw this.invalidCredentials();
    }

    const passwordMatches = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordMatches) {
      throw this.invalidCredentials();
    }

    if (
      user.accountStatus === AccountStatus.Suspended ||
      user.accountStatus === AccountStatus.Deactivated ||
      user.accountStatus === AccountStatus.Rejected
    ) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: ErrorCode.Forbidden,
          message: 'This account cannot access the platform.',
        },
      });
    }

    return this.buildAuthResult(user);
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('auth.refreshSecret'),
      });
      const user = await this.usersService.findAuthUserById(payload.sub);
      if (!user) {
        throw this.invalidCredentials();
      }
      return this.buildAuthResult(user);
    } catch {
      throw this.invalidCredentials();
    }
  }

  private async buildAuthResult(user: UserWithRoles): Promise<AuthResult> {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      email: user.email,
      accountStatus: user.accountStatus,
      roles: user.roles,
      agencyIds: user.agencyIds,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('auth.accessSecret'),
        expiresIn: this.config.getOrThrow<string>('auth.accessExpiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('auth.refreshSecret'),
        expiresIn: this.config.getOrThrow<string>('auth.refreshExpiresIn'),
      }),
    ]);

    const { passwordHash: _passwordHash, ...safeUser } = user;
    return {
      user: safeUser,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({
      success: false,
      error: {
        code: ErrorCode.InvalidCredentials,
        message: 'Invalid phone number or password.',
      },
    });
  }
}
