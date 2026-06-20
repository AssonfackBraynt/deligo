import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Use on @Public() endpoints that OPTIONALLY accept an authenticated user.
 * If a valid Bearer token is present, request.user is populated.
 * If missing or invalid, request.user stays undefined — the request is not blocked.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(_err: unknown, user: TUser): TUser | null {
    return user ?? null;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // No token or invalid token — treat caller as anonymous.
    }
    return true;
  }
}
