import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
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
import { CreateVerificationRecordDto } from './dto/verification-record.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateRiderRouteDto } from './dto/create-rider-route.dto';
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

  // NOTE: /me/* routes must be declared before /:id so NestJS doesn't treat "me" as a UUID param.

  @Get('me/stats')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Dashboard stats for the authenticated provider.' })
  async getStats(@CurrentUser() user: AuthenticatedUser) {
    return ok(await this.service.getStats(user.id));
  }

  @Get('me/agents')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'List riders/agents for this company provider. Company types only.' })
  async getMyAgents(@CurrentUser() user: AuthenticatedUser) {
    return ok(await this.service.getMyAgents(user.id));
  }

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

  @Get('me/verification-records')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Get all verification documents submitted by this provider.' })
  async getMyVerificationRecords(@CurrentUser() user: AuthenticatedUser) {
    return ok(await this.service.getMyVerificationRecords(user.id));
  }

  @Post('me/verification-records')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Submit a verification document (links to an uploaded file).' })
  async submitVerificationRecord(
    @Body() dto: CreateVerificationRecordDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.service.submitVerificationRecord(user.id, dto));
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

  // ── Company Branch Locations ───────────────────────────────────────────────

  @Post('me/branches')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Company providers: add a branch/sub-location at a specific quarter.' })
  async createBranch(@Body() dto: CreateBranchDto, @CurrentUser() user: AuthenticatedUser) {
    return ok(await this.service.createBranch(user.id, dto));
  }

  @Get('me/branches')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'List all branches for this company provider.' })
  async getMyBranches(@CurrentUser() user: AuthenticatedUser) {
    return ok(await this.service.getMyBranches(user.id));
  }

  @Get('me/branches/:branchId/stats')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Stats for a specific branch (active requests, completed deliveries in the branch town).' })
  async getBranchStats(
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.service.getBranchStats(user.id, branchId));
  }

  @Delete('me/branches/:branchId')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Remove a branch location.' })
  async deleteBranch(
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.service.deleteBranch(user.id, branchId));
  }

  // ── Rider Planned Routes ───────────────────────────────────────────────────

  @Post('me/routes')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Independent riders: post a planned route (origin quarter → destination quarter).' })
  async createRiderRoute(@Body() dto: CreateRiderRouteDto, @CurrentUser() user: AuthenticatedUser) {
    return ok(await this.service.createRiderRoute(user.id, dto));
  }

  @Get('me/routes')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'List all planned routes for this rider.' })
  async getMyRiderRoutes(@CurrentUser() user: AuthenticatedUser) {
    return ok(await this.service.getMyRiderRoutes(user.id));
  }

  @Get('me/routes/:routeId/matching-jobs')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Get open delivery requests that match a planned rider route (same-town proximity).' })
  async getRouteMatchingJobs(
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.service.getRouteMatchingJobs(user.id, routeId));
  }

  @Delete('me/routes/:routeId')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Deactivate / remove a planned route.' })
  async deleteRiderRoute(
    @Param('routeId', ParseUUIDPipe) routeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.service.deleteRiderRoute(user.id, routeId));
  }
}
