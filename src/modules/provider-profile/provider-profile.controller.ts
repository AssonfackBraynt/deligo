import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { ok } from '@common/dto/api-response.dto';
import { RoleCode } from '@common/enums/role-code.enum';
import { AuthenticatedUser } from '@common/types/authenticated-user.type';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import { ListProvidersQueryDto } from './dto/list-providers-query.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { ProviderProfilePrivateDto, ProviderProfilePublicDto } from './dto/provider-profile-response.dto';
import { ProviderProfileService } from './provider-profile.service';

@ApiTags('Provider Profiles')
@Controller('provider-profiles')
export class ProviderProfileController {
  constructor(private readonly service: ProviderProfileService) {}

  @Post()
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Create your provider profile. One profile per user.' })
  @ApiOkResponse({ type: ProviderProfilePrivateDto })
  async create(@Body() dto: CreateProviderProfileDto, @CurrentUser() user: AuthenticatedUser) {
    return ok(await this.service.create(user.id, dto));
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all providers. Public endpoint. Filterable and paginated.' })
  @ApiOkResponse({ type: ProviderProfilePublicDto, isArray: true })
  async findAll(@Query() query: ListProvidersQueryDto) {
    return ok(await this.service.findAll(query));
  }

  // NOTE: /me must be declared before /:id so NestJS does not treat "me" as a UUID param.

  @Get('me')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Get your own provider profile including private fields.' })
  @ApiOkResponse({ type: ProviderProfilePrivateDto })
  async findMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return ok(await this.service.findMyProfile(user.id));
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a single provider by ID. Public. Rider coordinates are masked.' })
  @ApiOkResponse({ type: ProviderProfilePublicDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return ok(await this.service.findOnePublic(id));
  }

  @Patch('me')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Update your own profile. providerType cannot be changed.' })
  @ApiOkResponse({ type: ProviderProfilePrivateDto })
  async update(@Body() dto: UpdateProviderProfileDto, @CurrentUser() user: AuthenticatedUser) {
    return ok(await this.service.update(user.id, dto));
  }

  @Patch('me/availability')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Update your availability status.' })
  @ApiOkResponse({ type: ProviderProfilePrivateDto })
  async updateAvailability(
    @Body() dto: UpdateAvailabilityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.service.updateAvailability(user.id, dto));
  }

  @Patch(':id/verification')
  @ApiBearerAuth()
  @Roles(RoleCode.Admin)
  @ApiOperation({ summary: 'Admin: update verification status of any provider profile.' })
  @ApiOkResponse({ type: ProviderProfilePrivateDto })
  async updateVerification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVerificationDto,
  ) {
    return ok(await this.service.updateVerification(id, dto));
  }
}
