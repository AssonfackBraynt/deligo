import { Body, Controller, Get, MessageEvent, Param, ParseUUIDPipe, Patch, Post, Query, Sse, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { ok } from '@common/dto/api-response.dto';
import { RoleCode } from '@common/enums/role-code.enum';
import { OptionalJwtAuthGuard } from '@common/guards/optional-jwt-auth.guard';
import { AuthenticatedUser } from '@common/types/authenticated-user.type';
import { DeliveryRequestService } from './delivery-request.service';
import { TrackingEventsService } from './tracking-events.service';
import { CreateDeliveryRequestDto } from './dto/create-delivery-request.dto';
import { BidOfferDto } from './dto/bid-offer.dto';
import { AssignRiderDto } from './dto/assign-rider.dto';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { AbandonDeliveryDto } from './dto/abandon-delivery.dto';
import { CancelDeliveryDto } from './dto/cancel-delivery.dto';

@ApiTags('Delivery Requests')
@Controller('delivery-requests')
export class DeliveryRequestController {
  constructor(
    private readonly service: DeliveryRequestService,
    private readonly trackingEvents: TrackingEventsService,
  ) {}

  // ── Customer: Create ───────────────────────────────────────────────────────

  @Post()
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Create a delivery request. No account required.' })
  async create(@Body() dto: CreateDeliveryRequestDto) {
    return ok(await this.service.create(dto));
  }

  // NOTE: all static paths (/track/*, /marketplace, /provider/*, /me/*)
  // must come before parameterised paths (/:id/*).

  @Get('track/:code/events')
  @Public()
  @Sse()
  @ApiOperation({ summary: 'SSE stream — server pushes a frame whenever this tracking code is updated.' })
  trackingEventStream(@Param('code') code: string): Observable<MessageEvent> {
    return this.trackingEvents.createStream(code);
  }

  @Get('track/:code')
  @Public()
  @ApiOperation({ summary: 'Public tracking — no auth required. Includes real events and offers.' })
  async findByTrackingCode(@Param('code') code: string) {
    return ok(await this.service.findByTrackingCode(code));
  }

  @Get('track/:code/review')
  @Public()
  @ApiOperation({ summary: 'Check review eligibility for a delivered request.' })
  async getReviewEligibility(@Param('code') code: string) {
    return ok(await this.service.getReviewEligibility(code));
  }

  @Post('track/:code/review')
  @Public()
  @ApiOperation({ summary: 'Submit a star rating + comment for a delivered request.' })
  async submitReview(@Param('code') code: string, @Body() dto: SubmitReviewDto) {
    return ok(await this.service.submitReview(code, dto));
  }

  @Patch('track/:code/review')
  @Public()
  @ApiOperation({ summary: 'Update an existing review for a delivered request.' })
  async updateReview(@Param('code') code: string, @Body() dto: SubmitReviewDto) {
    return ok(await this.service.updateReview(code, dto));
  }

  @Post('track/:code/offers/:offerId/accept')
  @Public()
  @ApiOperation({ summary: 'Customer accepts a provider bid on their marketplace request.' })
  async acceptOffer(@Param('code') code: string, @Param('offerId', ParseUUIDPipe) offerId: string) {
    return ok(await this.service.acceptOffer(code, offerId));
  }

  @Post('track/:code/offers/:offerId/reject')
  @Public()
  @ApiOperation({ summary: 'Customer rejects a specific provider bid.' })
  async rejectOffer(@Param('code') code: string, @Param('offerId', ParseUUIDPipe) offerId: string) {
    return ok(await this.service.rejectOffer(code, offerId));
  }

  @Get('recommended-providers')
  @Public()
  @ApiOperation({ summary: 'Ranked provider list. Supports ?city=, ?pickupQuarterId=, ?destinationQuarterId= for branch-proximity boosting.' })
  async recommendProviders(
    @Query('city') city?: string,
    @Query('pickupQuarterId') pickupQuarterId?: string,
    @Query('destinationQuarterId') destinationQuarterId?: string,
  ) {
    return ok(await this.service.recommendProviders(city, pickupQuarterId, destinationQuarterId));
  }

  // ── Customer: My requests ──────────────────────────────────────────────────

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all delivery requests linked to the authenticated user.' })
  async findAllMine(@CurrentUser() user: AuthenticatedUser) {
    return ok(await this.service.findAllMine(user.id));
  }

  @Get('me/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get one owned delivery request by ID.' })
  async findOneMine(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.service.findOneMine(user.id, id));
  }

  // ── Provider: Marketplace ──────────────────────────────────────────────────

  @Get('marketplace')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: "Open marketplace posts in the provider's area." })
  async listMarketplace(@CurrentUser() user: AuthenticatedUser) {
    return ok(await this.service.listMarketplace(user.id));
  }

  @Get('provider/direct-requests')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Direct requests sent to this provider by a customer. Awaiting acceptance.' })
  async getDirectRequests(@CurrentUser() user: AuthenticatedUser) {
    return ok(await this.service.getDirectRequests(user.id));
  }

  @Get('provider/my-requests')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Requests currently assigned to this provider.' })
  async getMyProviderRequests(@CurrentUser() user: AuthenticatedUser) {
    return ok(await this.service.getMyProviderRequests(user.id));
  }

  @Get('provider/my-offers')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Bids (offers) submitted by this provider.' })
  async getMyOffers(@CurrentUser() user: AuthenticatedUser) {
    return ok(await this.service.getMyOffers(user.id));
  }

  @Post(':id/take')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Provider directly accepts an open marketplace request.' })
  async takeRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.service.takeRequest(user.id, id));
  }

  @Post(':id/bid')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Provider submits a price bid on an open marketplace request.' })
  async bidOnRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BidOfferDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.service.bidOnRequest(user.id, id, dto));
  }

  @Post(':id/accept')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Provider accepts a direct request (recommended_provider / search_provider).' })
  async acceptDirectRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.service.acceptDirectRequest(user.id, id));
  }

  @Post(':id/reject')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Provider rejects a direct request. Request moves to open marketplace.' })
  async rejectDirectRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.service.rejectDirectRequest(user.id, id));
  }

  @Post(':id/workflow/:action')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Provider records a delivery workflow action: collect | start_transit | arrive | deliver' })
  async recordWorkflowAction(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('action') action: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.service.recordWorkflowAction(user.id, id, action));
  }

  // ── Company: Assign rider ──────────────────────────────────────────────────

  @Post(':id/assign-rider')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Company provider assigns a rider to an accepted request.' })
  async assignRider(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRiderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.service.assignRider(user.id, id, dto));
  }

  // ── Provider: abandon an accepted delivery ─────────────────────────────────

  @Post(':id/abandon')
  @ApiBearerAuth()
  @Roles(RoleCode.Provider)
  @ApiOperation({ summary: 'Provider abandons an accepted delivery after agreeing to liability terms and providing a reason. Request returns to open marketplace.' })
  async abandonDelivery(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AbandonDeliveryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return ok(await this.service.abandonDelivery(user.id, id, dto));
  }

  // ── Customer: cancel a request (before provider accepts) ──────────────────

  @Post('track/:code/cancel')
  @Public()
  @ApiOperation({ summary: 'Customer cancels a request that has no accepted provider yet.' })
  async cancelByTrackingCode(
    @Param('code') code: string,
    @Body() dto: CancelDeliveryDto,
  ) {
    return ok(await this.service.cancelByTrackingCode(code, dto));
  }
}
