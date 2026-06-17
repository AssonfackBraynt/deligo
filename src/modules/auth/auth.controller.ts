import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { ok } from '@common/dto/api-response.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '@common/types/authenticated-user.type';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOkResponse({ type: AuthResponseDto })
  async register(@Body() dto: RegisterDto) {
    return ok(await this.authService.register(dto));
  }

  @Public()
  @Post('login')
  @ApiOkResponse({ type: AuthResponseDto })
  async login(@Body() dto: LoginDto) {
    return ok(await this.authService.login(dto));
  }

  @Public()
  @Post('refresh')
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(@Body() dto: RefreshTokenDto) {
    return ok(await this.authService.refresh(dto.refreshToken));
  }

  @Post('logout')
  async logout() {
    return ok({ message: 'Logged out.' });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async me(@CurrentUser() user: AuthenticatedUser) {
    return ok(user);
  }
}
