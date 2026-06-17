import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AccountStatus } from '@common/enums/account-status.enum';
import { ErrorCode } from '@common/errors/error-codes';
import { AuthenticatedUser } from '@common/types/authenticated-user.type';
import { JwtPayload } from '@common/types/jwt-payload.type';
import { UsersService } from '@modules/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('auth.accessSecret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findAuthUserById(payload.sub);
    if (!user || user.accountStatus !== AccountStatus.Active) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: ErrorCode.AuthenticationRequired,
          message: 'Authentication is required.',
        },
      });
    }

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      accountStatus: user.accountStatus,
      roles: user.roles,
      agencyIds: user.agencyIds,
    };
  }
}
