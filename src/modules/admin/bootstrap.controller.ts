import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsEmail, IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { Public } from '@common/decorators/public.decorator';
import { ok } from '@common/dto/api-response.dto';
import { AdminService } from './admin.service';

class BootstrapAdminDto {
  @IsString()
  fullName: string;

  @IsPhoneNumber()
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(10)
  password: string;
}

/**
 * One-time bootstrap endpoint — permanently disabled once the first admin exists.
 * Kept in a separate controller so it does NOT inherit the class-level @Roles(Admin)
 * guard from AdminController.
 */
@Controller('admin/bootstrap')
export class BootstrapController {
  constructor(
    private readonly adminService: AdminService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  @Public()
  async bootstrap(
    @Headers('x-bootstrap-secret') secret: string,
    @Body() dto: BootstrapAdminDto,
  ) {
    const expected = this.config.get<string>('ADMIN_BOOTSTRAP_SECRET');

    // Reject if the env var was never set or the caller didn't supply the right secret
    if (!expected || !secret || secret !== expected) {
      throw new ForbiddenException('Invalid or missing bootstrap secret.');
    }

    return ok(await this.adminService.bootstrapAdmin(dto));
  }
}
