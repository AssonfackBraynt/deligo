import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { ok } from '@common/dto/api-response.dto';
import { RoleCode } from '@common/enums/role-code.enum';
import { AuthenticatedUser } from '@common/types/authenticated-user.type';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AdminService } from './admin.service';

class ReviewVerificationDto {
  @IsEnum(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  approvalNotes?: string;
}

class UpdateUserStatusDto {
  @IsEnum(['active', 'suspended', 'deactivated'])
  accountStatus: 'active' | 'suspended' | 'deactivated';
}

@ApiTags('Admin')
@Controller('admin')
@ApiBearerAuth()
@Roles(RoleCode.Admin)
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Admin dashboard statistics.' })
  async getStats() {
    return ok(await this.service.getStats());
  }

  // ── Providers ─────────────────────────────────────────────────────────────

  @Get('providers')
  @ApiOperation({ summary: 'List all providers. Filter by type, verification status, or search.' })
  async listProviders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('providerType') providerType?: string,
    @Query('verificationStatus') verificationStatus?: string,
    @Query('search') search?: string,
  ) {
    return ok(await this.service.listProviders({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      providerType,
      verificationStatus,
      search,
    }));
  }

  @Get('providers/:id')
  @ApiOperation({ summary: 'Full provider detail: profile + documents + requests + reviews.' })
  async getProviderDetail(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.getProviderDetail(id));
  }

  // ── Verification queue ────────────────────────────────────────────────────

  @Get('verifications')
  @ApiOperation({ summary: 'Verification queue. Defaults to pending status.' })
  async listVerifications(@Query('status') status?: string) {
    return ok(await this.service.listVerificationQueue(status));
  }

  @Patch('verifications/:id')
  @ApiOperation({ summary: 'Admin: approve or reject a single verification document.' })
  async reviewVerification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewVerificationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.service.reviewVerificationRecord(id, user.id, dto));
  }

  // ── Delivery monitoring ───────────────────────────────────────────────────

  @Get('requests')
  @ApiOperation({ summary: 'All delivery requests with optional status filter.' })
  async listRequests(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return ok(await this.service.listDeliveryRequests({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
    }));
  }

  @Get('tracking/:code')
  @ApiOperation({ summary: 'Full tracking timeline for any request.' })
  async getTracking(@Param('code') code: string) {
    return ok(await this.service.getRequestTracking(code));
  }

  // ── User management ───────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users with role and provider info.' })
  async listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return ok(await this.service.listUsers({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      search,
    }));
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Activate, suspend, or deactivate a user.' })
  async updateUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return ok(await this.service.updateUserStatus(id, dto.accountStatus));
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  @Get('notifications')
  @ApiOperation({ summary: 'System notifications. Filter by type.' })
  async listNotifications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    return ok(await this.service.listNotifications({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 30,
      type,
    }));
  }
}
