import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { DeliveryRequest, ProviderProfile, ProviderType, Quarter, Region, RequestItem, RequestRoute, Town } from '@prisma/client';
import { ErrorCode } from '@common/errors/error-codes';
import { PrismaService } from '@database/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { DeliGoGateway } from '../gateway/deligo.gateway';
import { TrackingEventsService } from './tracking-events.service';
import { CreateDeliveryRequestDto } from './dto/create-delivery-request.dto';
import { BidOfferDto } from './dto/bid-offer.dto';
import { AssignRiderDto } from './dto/assign-rider.dto';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { AbandonDeliveryDto } from './dto/abandon-delivery.dto';
import { CancelDeliveryDto } from './dto/cancel-delivery.dto';

// ── Tracking code ─────────────────────────────────────────────────────────────
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function buildCode(): string {
  let code = 'DLG-';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}


// ── Response shapes ───────────────────────────────────────────────────────────
type QuarterWithLocation = Quarter & {
  town: Town & { region: Region };
};

type RouteWithQuarters = RequestRoute & {
  pickupQuarter: QuarterWithLocation;
  destinationQuarter: QuarterWithLocation;
};

type WithRelations = DeliveryRequest & {
  route: RouteWithQuarters | null;
  items: RequestItem[];
};

function formatLocation(q: QuarterWithLocation): string {
  return `${q.name}, ${q.town.name}, ${q.town.region.name}`;
}

function toPublicResponse(r: WithRelations, extras: { events?: any[]; offers?: any[]; review?: { rating: number; comment: string | null } | null } = {}) {
  return {
    trackingCode: r.publicTrackingCode,
    requestStatus: r.requestStatus,
    fulfillmentMode: r.fulfillmentMode,
    deliveryType: r.deliveryType,
    estimatedDeliveryCost: r.deliveryCost ? Number(r.deliveryCost) : null,
    desiredRewardAmount: r.desiredRewardAmount ? Number(r.desiredRewardAmount) : null,
    createdAt: r.createdAt,
    route: r.route
      ? {
          pickup: formatLocation(r.route.pickupQuarter),
          pickupLandmark: r.route.pickupLandmark,
          destination: formatLocation(r.route.destinationQuarter),
          destinationLandmark: r.route.destinationLandmark,
        }
      : null,
    itemCount: r.items.length,
    hasFragileItems: r.items.some((i) => i.isFragile),
    events: extras.events ?? [],
    offers: extras.offers ?? [],
    review: extras.review ?? null,
  };
}

function toPrivateResponse(r: WithRelations, extras: { events?: any[] } = {}) {
  return {
    id: r.id,
    trackingCode: r.publicTrackingCode,
    requestStatus: r.requestStatus,
    fulfillmentMode: r.fulfillmentMode,
    deliveryType: r.deliveryType,
    customerContactId: r.customerContactId,
    selectedProviderProfileId: r.selectedProviderProfileId,
    desiredRewardAmount: r.desiredRewardAmount ? Number(r.desiredRewardAmount) : null,
    estimatedDeliveryCost: r.deliveryCost ? Number(r.deliveryCost) : null,
    expectedDeliveryDate: r.expectedDeliveryDate
      ? r.expectedDeliveryDate.toISOString().split('T')[0]
      : null,
    providerAssignedAt: r.providerAssignedAt ?? null,
    createdAt: r.createdAt,
    route: r.route
      ? {
          pickup: formatLocation(r.route.pickupQuarter),
          pickupQuarterId: r.route.pickupQuarterId,
          pickupLandmark: r.route.pickupLandmark,
          destination: formatLocation(r.route.destinationQuarter),
          destinationQuarterId: r.route.destinationQuarterId,
          destinationLandmark: r.route.destinationLandmark,
        }
      : null,
    items: r.items.map((item) => ({
      id: item.id,
      itemName: item.itemName,
      itemDescription: item.itemDescription,
      category: item.category,
      quantity: item.quantity,
      weightKg: item.weightKg ? Number(item.weightKg) : null,
      sizeLabel: item.sizeLabel,
      isFragile: item.isFragile,
      specialInstructions: item.specialInstructions,
      photoFileId: item.photoFileId ?? null,
    })),
    events: extras.events ?? [],
  };
}

function toMarketplaceCard(r: WithRelations) {
  return {
    id: r.id,
    trackingCode: r.publicTrackingCode,
    deliveryType: r.deliveryType,
    desiredRewardAmount: r.desiredRewardAmount ? Number(r.desiredRewardAmount) : null,
    estimatedDeliveryCost: r.deliveryCost ? Number(r.deliveryCost) : null,
    createdAt: r.createdAt,
    route: r.route
      ? {
          pickup: formatLocation(r.route.pickupQuarter),
          pickupLandmark: r.route.pickupLandmark,
          destination: formatLocation(r.route.destinationQuarter),
          destinationLandmark: r.route.destinationLandmark,
        }
      : null,
    items: {
      count: r.items.length,
      hasFragile: r.items.some((i) => i.isFragile),
      categories: [...new Set(r.items.map((i) => i.category).filter(Boolean))] as string[],
      summary: r.items.map((i) => i.itemName).join(', '),
      photoFileId: r.items[0]?.photoFileId ?? null,
    },
  };
}

// ── Route include helpers ─────────────────────────────────────────────────────
const ROUTE_INCLUDE = {
  pickupQuarter: { include: { town: { include: { region: true } } } },
  destinationQuarter: { include: { town: { include: { region: true } } } },
} as const;

const REQUEST_INCLUDE = {
  route: { include: ROUTE_INCLUDE },
  items: true,
} as const;

const COMPANY_PROVIDER_TYPES: ProviderType[] = ['courier_company', 'logistics_company'] as ProviderType[];

// Valid workflow transitions for providers
const WORKFLOW_TRANSITIONS: Record<string, { nextStatus: string; eventType: string; notes: string }> = {
  collect: {
    nextStatus: 'pickup_verified',
    eventType: 'PARCEL_COLLECTED',
    notes: 'Provider collected the parcel from pickup location.',
  },
  start_transit: {
    nextStatus: 'in_transit',
    eventType: 'IN_TRANSIT',
    notes: 'Parcel is in transit to destination.',
  },
  arrive: {
    nextStatus: 'in_transit',
    eventType: 'ARRIVED_DESTINATION',
    notes: 'Provider arrived at destination.',
  },
  deliver: {
    nextStatus: 'delivered',
    eventType: 'DELIVERED',
    notes: 'Parcel delivered to recipient.',
  },
};

const ALLOWED_WORKFLOW_STATUS: Record<string, string[]> = {
  collect: ['provider_assigned'],
  start_transit: ['pickup_verified'],
  arrive: ['in_transit'],
  deliver: ['in_transit'],
};

// ── Service ───────────────────────────────────────────────────────────────────
@Injectable()
export class DeliveryRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly trackingEvents: TrackingEventsService,
    private readonly gateway: DeliGoGateway,
  ) {}

  // ── Private helpers ────────────────────────────────────────────────────────

  private async generateUniqueTrackingCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = buildCode();
      const existing = await this.prisma.deliveryRequest.findUnique({
        where: { publicTrackingCode: code },
        select: { id: true },
      });
      if (!existing) return code;
    }
    throw new InternalServerErrorException('Failed to generate a unique tracking code.');
  }

  private async requireProviderProfile(userId: string): Promise<ProviderProfile> {
    const profile = await this.prisma.providerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!profile) {
      throw new NotFoundException({
        success: false,
        error: { code: ErrorCode.ResourceNotFound, message: 'Provider profile not found.' },
      });
    }
    return profile;
  }

  private async writeTrackingEvent(tx: any, opts: {
    deliveryRequestId: string;
    eventType: string;
    statusAfterEvent?: string;
    responsibleProviderProfileId?: string;
    notes?: string;
    locationText?: string;
  }) {
    await tx.trackingEvent.create({
      data: {
        deliveryRequestId: opts.deliveryRequestId,
        eventType: opts.eventType,
        statusAfterEvent: opts.statusAfterEvent ?? null,
        responsibleProviderProfileId: opts.responsibleProviderProfileId ?? null,
        notes: opts.notes ?? null,
        locationText: opts.locationText ?? null,
        occurredAt: new Date(),
      },
    });
  }

  private async loadTrackingEvents(requestId: string) {
    const events = await this.prisma.trackingEvent.findMany({
      where: { deliveryRequestId: requestId },
      orderBy: { occurredAt: 'asc' },
      include: {
        responsibleProviderProfile: { select: { displayName: true } },
      },
    });
    return events.map((e) => ({
      eventType: e.eventType,
      statusAfterEvent: e.statusAfterEvent,
      providerName: e.responsibleProviderProfile?.displayName ?? null,
      notes: e.notes,
      locationText: e.locationText,
      occurredAt: e.occurredAt,
    }));
  }

  private async loadOffers(requestId: string) {
    const offers = await this.prisma.marketplaceOffer.findMany({
      where: { deliveryRequestId: requestId, offerStatus: 'submitted', deletedAt: null },
      include: {
        providerProfile: { select: { displayName: true, ratingAverage: true, ratingCount: true } },
      },
      orderBy: { offerAmount: 'asc' },
    });
    return offers.map((o) => ({
      id: o.id,
      provider: o.providerProfile
        ? {
            name: o.providerProfile.displayName,
            rating: Number(o.providerProfile.ratingAverage),
            ratingCount: o.providerProfile.ratingCount,
          }
        : null,
      amount: Number(o.offerAmount),
      message: o.message,
      status: o.offerStatus,
      submittedAt: o.submittedAt.toISOString(),
    }));
  }

  // ── Pricing estimation ────────────────────────────────────────────────────

  private async estimateDeliveryCost(
    regionId: string,
    isSameTown: boolean,
    items: Array<{
      weightKg?: number | null;
      sizeLabel?: string | null;
      category?: string | null;
      quantity?: number | null;
      isFragile?: boolean | null;
    }>,
  ): Promise<number> {
    try {
      const priceField = isSameTown ? 'priceInTown' : 'priceInRegion';

      // Regional providers first (via ProviderBranch → Quarter → Town → Region)
      let providers = await this.prisma.providerProfile.findMany({
        where: {
          deletedAt: null,
          availabilityStatus: { not: 'offline' },
          [priceField]: { not: null },
          branches: {
            some: {
              isActive: true,
              deletedAt: null,
              quarter: { town: { regionId } },
            },
          },
        },
        select: { priceInTown: true, priceInRegion: true },
      });

      // Fallback: any provider with the price set (platform not yet dense in all regions)
      if (providers.length === 0) {
        providers = await this.prisma.providerProfile.findMany({
          where: {
            deletedAt: null,
            availabilityStatus: { not: 'offline' },
            [priceField]: { not: null },
          },
          select: { priceInTown: true, priceInRegion: true },
        });
      }

      const prices = providers
        .map((p) => (isSameTown ? p.priceInTown : p.priceInRegion))
        .filter((p): p is NonNullable<typeof p> => p != null)
        .map((p) => p.toNumber());

      const basePrice =
        prices.length > 0
          ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
          : 0;

      return basePrice + this.computeSurcharges(items);
    } catch {
      return 0;
    }
  }

  private computeSurcharges(
    items: Array<{
      weightKg?: number | null;
      sizeLabel?: string | null;
      category?: string | null;
      quantity?: number | null;
      isFragile?: boolean | null;
    }>,
  ): number {
    const first = items[0] ?? {};
    const totalQty = items.reduce((s, i) => s + (i.quantity ?? 1), 0);
    const w = first.weightKg ?? 0;
    const weightSurcharge = w > 50 ? 1500 : w > 35 ? 1000 : w > 20 ? 600 : w > 10 ? 300 : w > 5 ? 150 : 0;
    const size = first.sizeLabel ?? '';
    const sizeSurcharge = size === 'oversized' ? 1000 : size === 'large' ? 400 : size === 'medium' ? 200 : 0;
    const quantitySurcharge = Math.min(Math.max(0, totalQty - 1) * 50, 500);
    const fragileSurcharge = items.some((i) => i.isFragile) ? 300 : 0;
    const CATEGORY_SURCHARGE: Record<string, number> = { electronics: 200, food: 100, medical: 100, vehicle_parts: 300, furniture: 500 };
    const categorySurcharge = CATEGORY_SURCHARGE[first.category ?? ''] ?? 0;
    return weightSurcharge + sizeSurcharge + quantitySurcharge + fragileSurcharge + categorySurcharge;
  }

  async estimateForRequest(
    pickupQuarterId: string,
    destinationQuarterId: string,
    items: Array<{
      weightKg?: number | null;
      sizeLabel?: string | null;
      category?: string | null;
      quantity?: number | null;
      isFragile?: boolean | null;
    }>,
  ): Promise<{ estimatedCost: number; isSameTown: boolean }> {
    const [pickup, destination] = await Promise.all([
      this.prisma.quarter.findFirst({ where: { id: pickupQuarterId }, select: { townId: true, town: { select: { regionId: true } } } }),
      this.prisma.quarter.findFirst({ where: { id: destinationQuarterId }, select: { townId: true } }),
    ]);
    if (!pickup || !destination) return { estimatedCost: 0, isSameTown: false };
    const isSameTown = pickup.townId === destination.townId;
    const estimatedCost = await this.estimateDeliveryCost(pickup.town.regionId, isSameTown, items);
    return { estimatedCost, isSameTown };
  }

  // ── Customer: Create ───────────────────────────────────────────────────────

  async create(dto: CreateDeliveryRequestDto) {
    const contact = await this.prisma.customerContact.findFirst({
      where: { id: dto.customerContactId, deletedAt: null },
      select: { id: true, fullName: true, whatsappNumber: true },
    });
    if (!contact) {
      throw new NotFoundException({
        success: false,
        error: { code: ErrorCode.ResourceNotFound, message: 'Customer contact not found.' },
      });
    }

    const [pickupQuarter, destinationQuarter] = await Promise.all([
      this.prisma.quarter.findFirst({
        where: { id: dto.route.pickupQuarterId },
        include: { town: { include: { region: true } } },
      }),
      this.prisma.quarter.findFirst({
        where: { id: dto.route.destinationQuarterId },
        include: { town: { include: { region: true } } },
      }),
    ]);

    if (!pickupQuarter) throw new BadRequestException({ success: false, error: { code: ErrorCode.ValidationError, message: 'Pickup quarter not found.' } });
    if (!destinationQuarter) throw new BadRequestException({ success: false, error: { code: ErrorCode.ValidationError, message: 'Destination quarter not found.' } });

    let selectedProvider: ProviderProfile | null = null;
    if (dto.fulfillmentMode !== 'open_marketplace' && dto.selectedProviderProfileId) {
      selectedProvider = await this.prisma.providerProfile.findFirst({
        where: { id: dto.selectedProviderProfileId, deletedAt: null },
      });
      if (!selectedProvider) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Selected provider not found.' } });
    }

    const trackingCode = await this.generateUniqueTrackingCode();
    const mode = (dto.fulfillmentMode ?? 'open_marketplace') as any;
    const isDirect = mode !== 'open_marketplace';

    const deliveryCost = await this.estimateDeliveryCost(
      pickupQuarter.town.regionId,
      pickupQuarter.townId === destinationQuarter.townId,
      dto.items,
    );

    const pickupLabel = formatLocation(pickupQuarter as any);
    const destinationLabel = formatLocation(destinationQuarter as any);

    const requestId = await this.prisma.$transaction(async (tx) => {
      const request = await tx.deliveryRequest.create({
        data: {
          publicTrackingCode: trackingCode,
          customerContactId: dto.customerContactId,
          requestStatus: 'created',
          fulfillmentMode: mode,
          deliveryType: dto.deliveryType,
          expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
          desiredRewardAmount: dto.desiredRewardAmount ?? null,
          selectedProviderProfileId: dto.selectedProviderProfileId ?? null,
          deliveryCost,
          currency: 'XAF',
        },
      });

      await tx.requestRoute.create({
        data: {
          deliveryRequestId: request.id,
          pickupQuarterId: dto.route.pickupQuarterId,
          pickupLandmark: dto.route.pickupLandmark,
          pickupLat: dto.route.pickupLat ?? null,
          pickupLng: dto.route.pickupLng ?? null,
          destinationQuarterId: dto.route.destinationQuarterId,
          destinationLandmark: dto.route.destinationLandmark,
          destinationLat: dto.route.destinationLat ?? null,
          destinationLng: dto.route.destinationLng ?? null,
        },
      });

      await tx.requestItem.createMany({
        data: dto.items.map((item) => ({
          deliveryRequestId: request.id,
          itemName: item.itemName,
          itemDescription: item.itemDescription ?? null,
          category: item.category ?? null,
          weightKg: item.weightKg ?? null,
          sizeLabel: item.sizeLabel ?? null,
          quantity: item.quantity ?? 1,
          isFragile: item.isFragile ?? false,
          specialInstructions: item.specialInstructions ?? null,
          photoFileId: item.photoFileId ?? null,
        })),
      });

      // Create ProviderSelection for direct requests
      if (isDirect && dto.selectedProviderProfileId) {
        await tx.providerSelection.create({
          data: {
            deliveryRequestId: request.id,
            selectionMode: mode,
            selectedProviderProfileId: dto.selectedProviderProfileId,
          },
        });
      }

      // Write REQUEST_CREATED tracking event
      await this.writeTrackingEvent(tx, {
        deliveryRequestId: request.id,
        eventType: 'REQUEST_CREATED',
        statusAfterEvent: 'created',
        notes: isDirect ? `Direct request to provider ${selectedProvider?.displayName ?? ''}` : 'Posted to open marketplace.',
      });

      return request.id;
    });

    const full = await this.prisma.deliveryRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: REQUEST_INCLUDE,
    });

    // Fire-and-forget notification
    void this.notifications.notifyCustomerService({
      event: isDirect ? 'DIRECT_REQUEST' : 'NEW_REQUEST',
      trackingCode,
      deliveryRequestId: requestId,
      deliveryType: dto.deliveryType,
      customerName: contact.fullName,
      customerWhatsapp: contact.whatsappNumber,
      providerName: selectedProvider?.displayName,
      pickup: pickupLabel,
      destination: destinationLabel,
    });

    // WebSocket: notify connected providers
    if (!isDirect) {
      this.gateway.emitMarketplaceNew(toMarketplaceCard(full as WithRelations));
      this.gateway.emitAdminStatsChanged();
    } else if (dto.selectedProviderProfileId) {
      this.gateway.emitDirectRequestNew(dto.selectedProviderProfileId);
    }

    return toPrivateResponse(full as WithRelations);
  }

  // ── Public tracking ────────────────────────────────────────────────────────

  async findByTrackingCode(code: string) {
    const request = await this.prisma.deliveryRequest.findFirst({
      where: { publicTrackingCode: code.toUpperCase(), deletedAt: null },
      include: REQUEST_INCLUDE,
    });
    if (!request) {
      throw new NotFoundException({
        success: false,
        error: { code: ErrorCode.ResourceNotFound, message: 'No delivery request found with this tracking code.' },
      });
    }

    const [events, offers, review] = await Promise.all([
      this.loadTrackingEvents(request.id),
      request.fulfillmentMode === 'open_marketplace' ? this.loadOffers(request.id) : Promise.resolve([]),
      this.prisma.reviewRating.findFirst({
        where: { deliveryRequestId: request.id, deletedAt: null },
        select: { rating: true, comment: true },
      }),
    ]);

    return toPublicResponse(request as WithRelations, {
      events,
      offers,
      review: review ? { rating: Number(review.rating), comment: review.comment } : null,
    });
  }

  // ── Customer: Accept/Reject offer ─────────────────────────────────────────

  async acceptOffer(trackingCode: string, offerId: string) {
    const request = await this.prisma.deliveryRequest.findFirst({
      where: { publicTrackingCode: trackingCode.toUpperCase(), deletedAt: null },
      include: { customerContact: { select: { fullName: true, whatsappNumber: true } }, ...REQUEST_INCLUDE },
    });
    if (!request) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Request not found.' } });

    if (!['created', 'offers_received'].includes(request.requestStatus)) {
      throw new BadRequestException({ success: false, error: { code: ErrorCode.ValidationError, message: 'This request is no longer accepting offer selections.' } });
    }

    const offer = await this.prisma.marketplaceOffer.findFirst({
      where: { id: offerId, deliveryRequestId: request.id, offerStatus: 'submitted', deletedAt: null },
      include: { providerProfile: { select: { id: true, displayName: true } } },
    });
    if (!offer) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Offer not found.' } });

    await this.prisma.$transaction(async (tx) => {
      // Accept this offer
      await tx.marketplaceOffer.update({
        where: { id: offerId },
        data: { offerStatus: 'accepted', acceptedAt: new Date() },
      });

      // Reject all other submitted offers for this request
      await tx.marketplaceOffer.updateMany({
        where: { deliveryRequestId: request.id, offerStatus: 'submitted', id: { not: offerId }, deletedAt: null },
        data: { offerStatus: 'rejected', rejectedAt: new Date() },
      });

      // Assign provider + update status
      await tx.deliveryRequest.update({
        where: { id: request.id },
        data: {
          selectedProviderProfileId: offer.providerProfile?.id ?? null,
          acceptedOfferId: offerId,
          requestStatus: 'provider_assigned' as any,
          providerAssignedAt: new Date(),
        },
      });

      // Write tracking event
      await this.writeTrackingEvent(tx, {
        deliveryRequestId: request.id,
        eventType: 'PROVIDER_ASSIGNED',
        statusAfterEvent: 'provider_assigned',
        responsibleProviderProfileId: offer.providerProfile?.id,
        notes: `Customer accepted offer of ${Number(offer.offerAmount).toLocaleString()} FCFA from ${offer.providerProfile?.displayName ?? 'provider'}.`,
      });
    });

    this.trackingEvents.emit(request.publicTrackingCode);
    this.gateway.emitTrackingUpdate(request.publicTrackingCode);
    this.gateway.emitMarketplaceRemoved(request.id);
    this.gateway.emitAdminStatsChanged();

    void this.notifications.notifyCustomerService({
      event: 'BID_ACCEPTED',
      trackingCode: request.publicTrackingCode,
      deliveryRequestId: request.id,
      deliveryType: request.deliveryType,
      customerName: request.customerContact.fullName,
      customerWhatsapp: request.customerContact.whatsappNumber,
      providerName: offer.providerProfile?.displayName,
      amount: Number(offer.offerAmount),
    });

    return { success: true, message: 'Offer accepted. Provider has been assigned.' };
  }

  async rejectOffer(trackingCode: string, offerId: string) {
    const request = await this.prisma.deliveryRequest.findFirst({
      where: { publicTrackingCode: trackingCode.toUpperCase(), deletedAt: null },
    });
    if (!request) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Request not found.' } });

    await this.prisma.marketplaceOffer.updateMany({
      where: { id: offerId, deliveryRequestId: request.id, offerStatus: 'submitted', deletedAt: null },
      data: { offerStatus: 'rejected', rejectedAt: new Date() },
    });

    return { success: true, message: 'Offer rejected.' };
  }

  async counterOffer(trackingCode: string, offerId: string, amount: number, message?: string) {
    const request = await this.prisma.deliveryRequest.findFirst({
      where: { publicTrackingCode: trackingCode.toUpperCase(), deletedAt: null },
      include: { customerContact: { select: { fullName: true, whatsappNumber: true } } },
    });
    if (!request) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Request not found.' } });

    if (!['created', 'marketplace_open', 'offers_received'].includes(request.requestStatus)) {
      throw new BadRequestException({ success: false, error: { code: ErrorCode.ValidationError, message: 'Cannot counter-offer at this stage.' } });
    }

    const offer = await this.prisma.marketplaceOffer.findFirst({
      where: { id: offerId, deliveryRequestId: request.id, offerStatus: 'submitted', deletedAt: null },
      include: { providerProfile: { select: { displayName: true } } },
    });
    if (!offer) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Offer not found.' } });

    await this.prisma.deliveryRequest.update({
      where: { id: request.id },
      data: { desiredRewardAmount: amount },
    });

    void this.notifications.notifyCustomerService({
      event: 'COUNTER_OFFER',
      trackingCode: request.publicTrackingCode,
      deliveryRequestId: request.id,
      deliveryType: request.deliveryType,
      customerName: request.customerContact.fullName,
      customerWhatsapp: request.customerContact.whatsappNumber,
      providerName: offer.providerProfile?.displayName,
      amount,
      notes: message,
    });

    return { success: true };
  }

  // ── Customer: My requests ────────────────────────────────────────────────

  async findAllMine(userId: string) {
    const requests = await this.prisma.deliveryRequest.findMany({
      where: { customerContact: { userId }, deletedAt: null },
      include: REQUEST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return requests.map((r) => toPrivateResponse(r as WithRelations));
  }

  async findOneMine(userId: string, id: string) {
    const request = await this.prisma.deliveryRequest.findFirst({
      where: { id, deletedAt: null },
      include: REQUEST_INCLUDE,
    });
    if (!request) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Request not found.' } });

    const owned = await this.prisma.customerContact.findFirst({ where: { id: request.customerContactId, userId }, select: { id: true } });
    if (!owned) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Request not found.' } });

    return toPrivateResponse(request as WithRelations);
  }

  // ── Provider region filter (shared by marketplace list + badge count) ────────

  private async resolveProviderRegionFilter(userId: string): Promise<{ profileId: string; locationFilter: any }> {
    const profile = await this.requireProviderProfile(userId);
    const isCompany = COMPANY_PROVIDER_TYPES.includes(profile.providerType);

    let cityName: string | null = null;
    if (!isCompany && profile.baseCity) {
      cityName = profile.baseCity;
    } else if (isCompany && profile.agencyId) {
      const agency = await this.prisma.agency.findFirst({ where: { id: profile.agencyId }, select: { city: true } });
      cityName = agency?.city ?? null;
    }

    let locationFilter: any = {};
    if (cityName) {
      const town = await this.prisma.town.findFirst({
        where: { name: { equals: cityName, mode: 'insensitive' } },
        select: { regionId: true },
      });
      if (town?.regionId) {
        locationFilter = { route: { pickupQuarter: { town: { regionId: town.regionId } } } };
      }
    }

    return { profileId: profile.id, locationFilter };
  }

  // ── Provider: Marketplace ──────────────────────────────────────────────────

  async listMarketplace(userId: string) {
    const { locationFilter } = await this.resolveProviderRegionFilter(userId);

    const requests = await this.prisma.deliveryRequest.findMany({
      where: {
        deletedAt: null,
        requestStatus: { in: ['created', 'offers_received', 'marketplace_open'] },
        fulfillmentMode: 'open_marketplace',
        selectedProviderProfileId: null,
        ...locationFilter,
      },
      include: REQUEST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return requests.map((r) => toMarketplaceCard(r as WithRelations));
  }

  // ── Provider: Badge counts (nav notification dots) ────────────────────────

  async getBadgeCounts(userId: string) {
    const { profileId, locationFilter } = await this.resolveProviderRegionFilter(userId);

    const [marketplaceCount, directCount] = await Promise.all([
      this.prisma.deliveryRequest.count({
        where: {
          deletedAt: null,
          requestStatus: { in: ['created', 'offers_received', 'marketplace_open'] },
          fulfillmentMode: 'open_marketplace',
          selectedProviderProfileId: null,
          ...locationFilter,
        },
      }),
      this.prisma.deliveryRequest.count({
        where: {
          selectedProviderProfileId: profileId,
          fulfillmentMode: { in: ['recommended_provider', 'search_provider'] },
          requestStatus: 'created',
          deletedAt: null,
        },
      }),
    ]);

    return { marketplaceCount, directCount };
  }

  // ── Provider: Direct requests (customer selected this provider) ────────────

  async getDirectRequests(userId: string) {
    const profile = await this.requireProviderProfile(userId);

    const requests = await this.prisma.deliveryRequest.findMany({
      where: {
        selectedProviderProfileId: profile.id,
        fulfillmentMode: { in: ['recommended_provider', 'search_provider'] },
        requestStatus: 'created',
        deletedAt: null,
      },
      include: REQUEST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => toPrivateResponse(r as WithRelations));
  }

  // ── Provider: Accept a direct request ─────────────────────────────────────

  async acceptDirectRequest(userId: string, requestId: string) {
    const profile = await this.requireProviderProfile(userId);

    const request = await this.prisma.deliveryRequest.findFirst({
      where: { id: requestId, deletedAt: null },
      include: { customerContact: { select: { fullName: true, whatsappNumber: true } }, ...REQUEST_INCLUDE },
    });
    if (!request) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Request not found.' } });
    if (request.selectedProviderProfileId !== profile.id) throw new ForbiddenException({ success: false, error: { code: ErrorCode.Forbidden, message: 'This request was not sent to you.' } });
    if (request.requestStatus !== 'created') throw new BadRequestException({ success: false, error: { code: ErrorCode.ValidationError, message: 'Request is no longer pending acceptance.' } });

    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryRequest.update({
        where: { id: requestId },
        data: { requestStatus: 'provider_assigned' as any, providerAssignedAt: new Date() },
      });
      await this.writeTrackingEvent(tx, {
        deliveryRequestId: requestId,
        eventType: 'PROVIDER_ASSIGNED',
        statusAfterEvent: 'provider_assigned',
        responsibleProviderProfileId: profile.id,
        notes: `Provider ${profile.displayName} accepted the direct request.`,
      });
    });

    this.trackingEvents.emit(request.publicTrackingCode);
    this.gateway.emitTrackingUpdate(request.publicTrackingCode);
    this.gateway.emitAdminStatsChanged();

    void this.notifications.notifyCustomerService({
      event: 'PROVIDER_ASSIGNED',
      trackingCode: request.publicTrackingCode,
      deliveryRequestId: request.id,
      deliveryType: request.deliveryType,
      customerName: request.customerContact.fullName,
      customerWhatsapp: request.customerContact.whatsappNumber,
      providerName: profile.displayName,
    });

    return { success: true, message: 'Request accepted.' };
  }

  // ── Provider: Reject a direct request ────────────────────────────────────

  async rejectDirectRequest(userId: string, requestId: string) {
    const profile = await this.requireProviderProfile(userId);

    const request = await this.prisma.deliveryRequest.findFirst({ where: { id: requestId, deletedAt: null } });
    if (!request) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Request not found.' } });
    if (request.selectedProviderProfileId !== profile.id) throw new ForbiddenException({ success: false, error: { code: ErrorCode.Forbidden, message: 'This request was not sent to you.' } });
    if (request.requestStatus !== 'created') throw new BadRequestException({ success: false, error: { code: ErrorCode.ValidationError, message: 'Request is no longer pending acceptance.' } });

    await this.prisma.$transaction(async (tx) => {
      // Fall back to open marketplace
      await tx.deliveryRequest.update({
        where: { id: requestId },
        data: {
          selectedProviderProfileId: null,
          fulfillmentMode: 'open_marketplace' as any,
          requestStatus: 'created' as any,
        },
      });
      await this.writeTrackingEvent(tx, {
        deliveryRequestId: requestId,
        eventType: 'DIRECT_REQUEST_REJECTED',
        statusAfterEvent: 'created',
        notes: `Provider ${profile.displayName} rejected the direct request. Moved to open marketplace.`,
      });
    });

    return { success: true, message: 'Request rejected. It will be posted to the open marketplace.' };
  }

  // ── Provider: Take marketplace request ─────────────────────────────────────

  async takeRequest(userId: string, requestId: string) {
    const profile = await this.requireProviderProfile(userId);

    const request = await this.prisma.deliveryRequest.findFirst({
      where: { id: requestId, deletedAt: null },
      include: { customerContact: { select: { fullName: true, whatsappNumber: true } }, ...REQUEST_INCLUDE },
    });
    if (!request) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Request not found.' } });
    if (!['created', 'offers_received'].includes(request.requestStatus)) throw new BadRequestException({ success: false, error: { code: ErrorCode.ValidationError, message: 'This request is no longer available.' } });
    if (request.fulfillmentMode !== 'open_marketplace') throw new BadRequestException({ success: false, error: { code: ErrorCode.ValidationError, message: 'This request is not on the open marketplace.' } });
    if (request.selectedProviderProfileId) throw new ConflictException({ success: false, error: { code: ErrorCode.Conflict, message: 'This request has already been taken.' } });

    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryRequest.update({
        where: { id: requestId },
        data: { selectedProviderProfileId: profile.id, requestStatus: 'provider_assigned' as any, providerAssignedAt: new Date() },
      });

      // Reject all outstanding bids
      await tx.marketplaceOffer.updateMany({
        where: { deliveryRequestId: requestId, offerStatus: 'submitted', deletedAt: null },
        data: { offerStatus: 'rejected', rejectedAt: new Date() },
      });

      await this.writeTrackingEvent(tx, {
        deliveryRequestId: requestId,
        eventType: 'PROVIDER_ASSIGNED',
        statusAfterEvent: 'provider_assigned',
        responsibleProviderProfileId: profile.id,
        notes: `Provider ${profile.displayName} took the request directly.`,
      });
    });

    this.trackingEvents.emit(request.publicTrackingCode);
    this.gateway.emitTrackingUpdate(request.publicTrackingCode);
    this.gateway.emitMarketplaceRemoved(requestId);
    this.gateway.emitAdminStatsChanged();

    void this.notifications.notifyCustomerService({
      event: 'PROVIDER_ASSIGNED',
      trackingCode: request.publicTrackingCode,
      deliveryRequestId: request.id,
      deliveryType: request.deliveryType,
      customerName: request.customerContact.fullName,
      customerWhatsapp: request.customerContact.whatsappNumber,
      providerName: profile.displayName,
    });

    const full = await this.prisma.deliveryRequest.findUniqueOrThrow({ where: { id: requestId }, include: REQUEST_INCLUDE });
    return toPrivateResponse(full as WithRelations);
  }

  // ── Provider: Bid on request ───────────────────────────────────────────────

  async bidOnRequest(userId: string, requestId: string, dto: BidOfferDto) {
    const profile = await this.requireProviderProfile(userId);

    const request = await this.prisma.deliveryRequest.findFirst({
      where: { id: requestId, deletedAt: null },
      include: { customerContact: { select: { fullName: true, whatsappNumber: true } }, ...REQUEST_INCLUDE },
    });
    if (!request) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Request not found.' } });
    if (!['created', 'offers_received'].includes(request.requestStatus)) throw new BadRequestException({ success: false, error: { code: ErrorCode.ValidationError, message: 'This request is no longer accepting bids.' } });
    if (request.fulfillmentMode !== 'open_marketplace') throw new BadRequestException({ success: false, error: { code: ErrorCode.ValidationError, message: 'This request is not on the open marketplace.' } });
    if (request.selectedProviderProfileId) throw new ConflictException({ success: false, error: { code: ErrorCode.Conflict, message: 'This request has already been taken.' } });

    const existingOffer = await this.prisma.marketplaceOffer.findFirst({
      where: { deliveryRequestId: requestId, providerProfileId: profile.id, offerStatus: 'submitted', deletedAt: null },
    });
    if (existingOffer) throw new ConflictException({ success: false, error: { code: ErrorCode.Conflict, message: 'You have already submitted a bid for this request.' } });

    await this.prisma.$transaction(async (tx) => {
      await tx.marketplaceOffer.create({
        data: { deliveryRequestId: requestId, providerProfileId: profile.id, offerAmount: dto.offerAmount, message: dto.message ?? null },
      });
      if (request.requestStatus === 'created') {
        await tx.deliveryRequest.update({ where: { id: requestId }, data: { requestStatus: 'offers_received' as any } });
      }
    });

    this.trackingEvents.emit(request.publicTrackingCode);
    this.gateway.emitTrackingUpdate(request.publicTrackingCode);

    void this.notifications.notifyCustomerService({
      event: 'NEW_BID',
      trackingCode: request.publicTrackingCode,
      deliveryRequestId: request.id,
      deliveryType: request.deliveryType,
      customerName: request.customerContact.fullName,
      customerWhatsapp: request.customerContact.whatsappNumber,
      providerName: profile.displayName,
      amount: dto.offerAmount,
    });

    return { success: true, message: 'Bid submitted successfully.' };
  }

  // ── Provider: Workflow actions (Collect → Transit → Deliver) ──────────────

  async recordWorkflowAction(userId: string, requestId: string, action: string) {
    const profile = await this.requireProviderProfile(userId);
    const transition = WORKFLOW_TRANSITIONS[action];
    if (!transition) throw new BadRequestException({ success: false, error: { code: ErrorCode.ValidationError, message: `Unknown action: ${action}. Valid actions: collect, start_transit, arrive, deliver.` } });

    const request = await this.prisma.deliveryRequest.findFirst({
      where: { id: requestId, deletedAt: null },
      include: { customerContact: { select: { fullName: true, whatsappNumber: true } }, ...REQUEST_INCLUDE },
    });
    if (!request) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Request not found.' } });
    if (request.selectedProviderProfileId !== profile.id) throw new ForbiddenException({ success: false, error: { code: ErrorCode.Forbidden, message: 'You are not assigned to this request.' } });

    const allowedFromStatuses = ALLOWED_WORKFLOW_STATUS[action] ?? [];
    if (!allowedFromStatuses.includes(request.requestStatus)) {
      throw new BadRequestException({
        success: false,
        error: { code: ErrorCode.ValidationError, message: `Action "${action}" is not allowed from status "${request.requestStatus}". Expected: ${allowedFromStatuses.join(' or ')}.` },
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryRequest.update({
        where: { id: requestId },
        data: { requestStatus: transition.nextStatus as any, ...(transition.nextStatus === 'delivered' ? { completedAt: new Date() } : {}) },
      });

      await this.writeTrackingEvent(tx, {
        deliveryRequestId: requestId,
        eventType: transition.eventType,
        statusAfterEvent: transition.nextStatus,
        responsibleProviderProfileId: profile.id,
        notes: transition.notes,
      });
    });

    this.trackingEvents.emit(request.publicTrackingCode);
    this.gateway.emitTrackingUpdate(request.publicTrackingCode);
    if (action === 'deliver') this.gateway.emitAdminStatsChanged();

    if (action === 'deliver') {
      void this.notifications.notifyCustomerService({
        event: 'DELIVERY_COMPLETED',
        trackingCode: request.publicTrackingCode,
        deliveryRequestId: request.id,
        deliveryType: request.deliveryType,
        customerName: request.customerContact.fullName,
        customerWhatsapp: request.customerContact.whatsappNumber,
        providerName: profile.displayName,
      });
    } else if (action === 'collect') {
      void this.notifications.notifyCustomerService({
        event: 'PARCEL_COLLECTED',
        trackingCode: request.publicTrackingCode,
        deliveryRequestId: request.id,
        deliveryType: request.deliveryType,
        customerName: request.customerContact.fullName,
        customerWhatsapp: request.customerContact.whatsappNumber,
        providerName: profile.displayName,
      });
    } else if (action === 'start_transit') {
      void this.notifications.notifyCustomerService({
        event: 'IN_TRANSIT',
        trackingCode: request.publicTrackingCode,
        deliveryRequestId: request.id,
        deliveryType: request.deliveryType,
        customerName: request.customerContact.fullName,
        customerWhatsapp: request.customerContact.whatsappNumber,
        providerName: profile.displayName,
      });
    }

    return { success: true, action, newStatus: transition.nextStatus };
  }

  // ── Provider: My assigned requests ───────────────────────────────────────

  async getMyProviderRequests(userId: string) {
    const profile = await this.requireProviderProfile(userId);
    const requests = await this.prisma.deliveryRequest.findMany({
      where: { selectedProviderProfileId: profile.id, deletedAt: null },
      include: REQUEST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return requests.map((r) => toPrivateResponse(r as WithRelations));
  }

  // ── Provider: My submitted offers ────────────────────────────────────────

  async getMyOffers(userId: string) {
    const profile = await this.requireProviderProfile(userId);
    const offers = await this.prisma.marketplaceOffer.findMany({
      where: { providerProfileId: profile.id, offerStatus: 'submitted', deletedAt: null },
      include: { request: { include: REQUEST_INCLUDE } },
      orderBy: { submittedAt: 'desc' },
    });
    return offers.map((o) => ({
      id: o.id,
      offerAmount: Number(o.offerAmount),
      message: o.message,
      submittedAt: o.submittedAt,
      request: toMarketplaceCard(o.request as WithRelations),
    }));
  }

  // ── Company: Assign rider ─────────────────────────────────────────────────

  async assignRider(userId: string, requestId: string, dto: AssignRiderDto) {
    const profile = await this.requireProviderProfile(userId);
    if (!COMPANY_PROVIDER_TYPES.includes(profile.providerType)) throw new ForbiddenException({ success: false, error: { code: ErrorCode.Forbidden, message: 'Only company providers can assign riders.' } });
    if (!profile.agencyId) throw new BadRequestException({ success: false, error: { code: ErrorCode.ValidationError, message: 'No agency configured for this provider profile.' } });

    const [request, rider] = await Promise.all([
      this.prisma.deliveryRequest.findFirst({ where: { id: requestId, deletedAt: null } }),
      this.prisma.rider.findFirst({ where: { id: dto.riderId, agencyId: profile.agencyId, deletedAt: null } }),
    ]);
    if (!request) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Request not found.' } });
    if (request.selectedProviderProfileId !== profile.id) throw new ForbiddenException({ success: false, error: { code: ErrorCode.Forbidden, message: 'You can only assign riders to requests you have accepted.' } });
    if (!rider) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Rider not found in your agency.' } });

    await this.prisma.$transaction(async (tx) => {
      await tx.dispatchAssignment.create({
        data: { deliveryRequestId: requestId, agencyId: profile.agencyId!, riderId: dto.riderId, assignmentStatus: 'assigned', assignedAt: new Date() },
      });
      await tx.rider.update({ where: { id: dto.riderId }, data: { currentWorkload: { increment: 1 } } });
    });

    return { success: true, message: 'Rider assigned successfully.' };
  }

  // ── Review & Rating ───────────────────────────────────────────────────────

  async getReviewEligibility(trackingCode: string) {
    const request = await this.prisma.deliveryRequest.findFirst({
      where: { publicTrackingCode: trackingCode.toUpperCase(), deletedAt: null },
      select: { id: true, requestStatus: true, selectedProviderProfileId: true, customerContactId: true },
    });
    if (!request) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Request not found.' } });

    const isEligible = request.requestStatus === 'delivered' || request.requestStatus === 'completed';
    const existingReview = isEligible
      ? await this.prisma.reviewRating.findFirst({
          where: { deliveryRequestId: request.id, deletedAt: null },
          select: { id: true, rating: true, comment: true, createdAt: true },
        })
      : null;

    return { isEligible, existingReview, requestStatus: request.requestStatus };
  }

  async submitReview(trackingCode: string, dto: SubmitReviewDto) {
    const request = await this.prisma.deliveryRequest.findFirst({
      where: { publicTrackingCode: trackingCode.toUpperCase(), deletedAt: null },
      select: { id: true, requestStatus: true, selectedProviderProfileId: true, customerContactId: true },
    });
    if (!request) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Request not found.' } });

    if (!['delivered', 'completed'].includes(request.requestStatus)) {
      throw new BadRequestException({ success: false, error: { code: ErrorCode.ValidationError, message: 'Reviews are only allowed for delivered requests.' } });
    }

    const existing = await this.prisma.reviewRating.findFirst({
      where: { deliveryRequestId: request.id, customerContactId: request.customerContactId, deletedAt: null },
    });
    if (existing) throw new ConflictException({ success: false, error: { code: ErrorCode.Conflict, message: 'You have already submitted a review for this delivery.' } });

    await this.prisma.$transaction(async (tx) => {
      await tx.reviewRating.create({
        data: {
          deliveryRequestId: request.id,
          customerContactId: request.customerContactId,
          providerProfileId: request.selectedProviderProfileId ?? null,
          rating: dto.rating,
          comment: dto.comment ?? null,
        },
      });

      // Recalculate provider rating
      if (request.selectedProviderProfileId) {
        const agg = await tx.reviewRating.aggregate({
          where: { providerProfileId: request.selectedProviderProfileId, deletedAt: null },
          _avg: { rating: true },
          _count: { rating: true },
        });
        await tx.providerProfile.update({
          where: { id: request.selectedProviderProfileId },
          data: {
            ratingAverage: agg._avg.rating ?? 0,
            ratingCount: agg._count.rating,
          },
        });
      }
    });

    return { success: true, message: 'Review submitted. Thank you!' };
  }

  async updateReview(trackingCode: string, dto: SubmitReviewDto) {
    const request = await this.prisma.deliveryRequest.findFirst({
      where: { publicTrackingCode: trackingCode.toUpperCase(), deletedAt: null },
      select: { id: true, requestStatus: true, selectedProviderProfileId: true, customerContactId: true },
    });
    if (!request) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Request not found.' } });

    if (!['delivered', 'completed'].includes(request.requestStatus)) {
      throw new BadRequestException({ success: false, error: { code: ErrorCode.ValidationError, message: 'Reviews are only allowed for delivered requests.' } });
    }

    const existing = await this.prisma.reviewRating.findFirst({
      where: { deliveryRequestId: request.id, customerContactId: request.customerContactId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'No existing review found. Submit a review first.' } });

    await this.prisma.$transaction(async (tx) => {
      await tx.reviewRating.update({
        where: { id: existing.id },
        data: { rating: dto.rating, comment: dto.comment ?? null },
      });

      if (request.selectedProviderProfileId) {
        const agg = await tx.reviewRating.aggregate({
          where: { providerProfileId: request.selectedProviderProfileId, deletedAt: null },
          _avg: { rating: true },
          _count: { rating: true },
        });
        await tx.providerProfile.update({
          where: { id: request.selectedProviderProfileId },
          data: {
            ratingAverage: agg._avg.rating ?? 0,
            ratingCount: agg._count.rating,
          },
        });
      }
    });

    return { success: true, message: 'Review updated.' };
  }

  // ── Recommended providers ─────────────────────────────────────────────────

  async recommendProviders(
    city?: string,
    pickupQuarterId?: string,
    destinationQuarterId?: string,
    itemHints?: {
      weightKg?: number;
      sizeLabel?: string;
      category?: string;
      quantity?: number;
      isFragile?: boolean;
    },
  ) {
    // Resolve town IDs and pickup region for filtering + branch proximity matching
    let pickupTownId: string | undefined;
    let destinationTownId: string | undefined;
    let pickupRegionName: string | undefined;

    if (pickupQuarterId) {
      const q = await this.prisma.quarter.findFirst({
        where: { id: pickupQuarterId },
        select: { townId: true, town: { select: { region: { select: { name: true } } } } },
      });
      pickupTownId = q?.townId;
      pickupRegionName = q?.town?.region?.name;
    }
    if (destinationQuarterId) {
      const q = await this.prisma.quarter.findFirst({ where: { id: destinationQuarterId }, select: { townId: true } });
      destinationTownId = q?.townId;
    }

    const isSameTown = !!(pickupTownId && destinationTownId && pickupTownId === destinationTownId);

    // Find company providers that have a branch in the pickup or destination town
    const nearbyBranchTownIds = [pickupTownId, destinationTownId].filter(Boolean) as string[];
    const branchMap = new Map<string, string>(); // providerProfileId → branch name
    if (nearbyBranchTownIds.length > 0) {
      const branches = await this.prisma.providerBranch.findMany({
        where: { deletedAt: null, isActive: true, quarter: { townId: { in: nearbyBranchTownIds } } },
        select: { providerProfileId: true, name: true },
      });
      for (const b of branches) {
        if (!branchMap.has(b.providerProfileId)) branchMap.set(b.providerProfileId, b.name);
      }
    }

    // When a pickup region is known, restrict results strictly to that region.
    // serviceCoverage is stored as "{RegionName} region" (e.g. "Littoral region").
    // Exact match avoids false positives like "North" matching "Far North region".
    const regionFilter = pickupRegionName
      ? { serviceCoverage: `${pickupRegionName} region` }
      : {};

    const providers = await this.prisma.providerProfile.findMany({
      where: { deletedAt: null, availabilityStatus: { in: ['available', 'busy'] as any[] }, ...regionFilter },
      select: { id: true, displayName: true, providerType: true, baseCity: true, ratingAverage: true, ratingCount: true, verificationStatus: true, availabilityStatus: true, isFeatured: true, priceInTown: true, priceInRegion: true },
    });

    const surcharges = itemHints ? this.computeSurcharges([itemHints]) : 0;

    return providers
      .map((p) => {
        let score = 0;
        if (city && p.baseCity?.toLowerCase().includes(city.toLowerCase())) score += 10;
        if (branchMap.has(p.id)) score += 12;
        if (p.verificationStatus === 'verified') score += 5;
        else if (p.verificationStatus === 'pending') score += 2;
        if (p.availabilityStatus === 'available') score += 3;
        else if (p.availabilityStatus === 'busy') score += 1;
        score += Number(p.ratingAverage) * 0.4;
        if (p.isFeatured) score += 1;
        const basePrice = isSameTown ? p.priceInTown?.toNumber() ?? null : p.priceInRegion?.toNumber() ?? null;
        const estimatedPrice = basePrice !== null ? basePrice + surcharges : null;
        const { priceInTown: _pit, priceInRegion: _pir, ...rest } = p;
        return { ...rest, ratingAverage: Number(p.ratingAverage), nearbyBranchName: branchMap.get(p.id) ?? null, estimatedPrice, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(({ score: _score, ...p }) => p);
  }

  // ── Provider: abandon an accepted delivery ────────────────────────────────

  async abandonDelivery(userId: string, requestId: string, dto: AbandonDeliveryDto) {
    const profile = await this.prisma.providerProfile.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Provider profile not found.' } });

    const request = await this.prisma.deliveryRequest.findFirst({
      where: { id: requestId, selectedProviderProfileId: profile.id, deletedAt: null },
      select: { id: true, requestStatus: true, publicTrackingCode: true, acceptedOfferId: true },
    });
    if (!request) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Request not found or not assigned to you.' } });

    const ABANDONABLE = ['provider_assigned', 'pickup_verified', 'in_transit'];
    if (!ABANDONABLE.includes(request.requestStatus)) {
      throw new BadRequestException({ success: false, error: { code: ErrorCode.ValidationError, message: `Cannot abandon a request in status "${request.requestStatus}".` } });
    }

    await this.prisma.$transaction(async (tx) => {
      if (request.acceptedOfferId) {
        await tx.marketplaceOffer.update({
          where: { id: request.acceptedOfferId },
          data: { offerStatus: 'withdrawn' },
        });
      }

      await tx.deliveryRequest.update({
        where: { id: request.id },
        data: {
          requestStatus: 'marketplace_open' as any,
          fulfillmentMode: 'open_marketplace' as any,
          selectedProviderProfileId: null,
          acceptedOfferId: null,
          providerAssignedAt: null,
        },
      });

      await tx.trackingEvent.create({
        data: {
          deliveryRequestId: request.id,
          eventType: 'PROVIDER_ABANDONED',
          statusAfterEvent: 'marketplace_open',
          responsibleProviderProfileId: profile.id,
          notes: `Provider abandoned delivery. Reason: ${dto.reason}`,
          occurredAt: new Date(),
        },
      });
    });

    this.trackingEvents.emit(request.publicTrackingCode);
    this.gateway.emitTrackingUpdate(request.publicTrackingCode);
    return { success: true, message: 'Delivery abandoned. The request has been returned to the open marketplace.' };
  }

  // ── Customer: cancel a request before provider accepts ────────────────────

  async cancelByTrackingCode(trackingCode: string, dto: CancelDeliveryDto) {
    const request = await this.prisma.deliveryRequest.findFirst({
      where: { publicTrackingCode: trackingCode.toUpperCase(), deletedAt: null },
      select: { id: true, requestStatus: true, publicTrackingCode: true },
    });
    if (!request) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Request not found.' } });

    const CANCELLABLE = ['draft', 'created', 'marketplace_open', 'offers_received'];
    if (!CANCELLABLE.includes(request.requestStatus)) {
      const providerAlreadyIn = ['provider_assigned', 'pickup_verified', 'in_transit', 'delivered', 'completed'].includes(request.requestStatus);
      throw new BadRequestException({
        success: false,
        error: {
          code: ErrorCode.ValidationError,
          message: providerAlreadyIn
            ? 'A provider has already accepted this request. You cannot cancel it at this stage.'
            : `Cannot cancel a request with status "${request.requestStatus}".`,
        },
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.marketplaceOffer.updateMany({
        where: { deliveryRequestId: request.id, offerStatus: 'submitted' },
        data: { offerStatus: 'expired' as any },
      });

      await tx.deliveryRequest.update({
        where: { id: request.id },
        data: { requestStatus: 'cancelled' as any, cancelledAt: new Date() },
      });

      await tx.trackingEvent.create({
        data: {
          deliveryRequestId: request.id,
          eventType: 'REQUEST_CANCELLED',
          statusAfterEvent: 'cancelled',
          notes: dto.reason ? `Customer cancelled. Reason: ${dto.reason}` : 'Customer cancelled the request.',
          occurredAt: new Date(),
        },
      });
    });

    this.trackingEvents.emit(request.publicTrackingCode);
    this.gateway.emitTrackingUpdate(request.publicTrackingCode);
    this.gateway.emitAdminStatsChanged();
    return { success: true, message: 'Request cancelled successfully.' };
  }
}
