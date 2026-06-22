import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProviderProfile, ProviderType, VerificationStatus } from '@prisma/client';
import { ErrorCode } from '@common/errors/error-codes';
import { PrismaService } from '@database/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import { ListProvidersQueryDto } from './dto/list-providers-query.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { CreateVerificationRecordDto, ReviewVerificationRecordDto } from './dto/verification-record.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateRiderRouteDto } from './dto/create-rider-route.dto';

// ── Response projections ───────────────────────────────────────────────────

const COMPANY_TYPES: ProviderType[] = [ProviderType.courier_company, ProviderType.logistics_company];

function toPublicResponse(p: ProviderProfile) {
  const isCompany = COMPANY_TYPES.includes(p.providerType);
  const isRider = p.providerType === ProviderType.independent_rider;
  return {
    id: p.id,
    providerType: p.providerType,
    displayName: p.displayName,
    description: p.description,
    baseCity: isRider ? p.baseCity : undefined,
    baseCountry: p.baseCountry,
    serviceCoverage: isRider ? p.serviceCoverage : undefined,
    businessAddress: isCompany ? p.businessAddress : undefined,
    businessLat: isCompany ? (p.businessLat != null ? p.businessLat.toNumber() : null) : undefined,
    businessLng: isCompany ? (p.businessLng != null ? p.businessLng.toNumber() : null) : undefined,
    ratingAverage: p.ratingAverage.toNumber(),
    ratingCount: p.ratingCount,
    verificationStatus: p.verificationStatus,
    availabilityStatus: p.availabilityStatus,
    isFeatured: p.isFeatured,
    phoneNumber: p.verificationStatus === VerificationStatus.verified ? p.phoneNumber : undefined,
  };
}

function toPrivateResponse(p: ProviderProfile) {
  return {
    ...toPublicResponse(p),
    userId: p.userId,
    agencyId: p.agencyId,
    phoneNumber: p.phoneNumber,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function toAdminResponse(p: ProviderProfile) {
  return {
    ...toPrivateResponse(p),
    createdBy: p.createdBy,
    updatedBy: p.updatedBy,
    deletedAt: p.deletedAt,
  };
}

// ── Service ────────────────────────────────────────────────────────────────

@Injectable()
export class ProviderProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  private async requireProfile(userId: string): Promise<ProviderProfile> {
    const profile = await this.prisma.providerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!profile) {
      throw new NotFoundException({
        success: false,
        error: { code: ErrorCode.ResourceNotFound, message: 'You do not have a provider profile yet.' },
      });
    }
    return profile;
  }

  async create(userId: string, dto: CreateProviderProfileDto) {
    const existing = await this.prisma.providerProfile.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        success: false,
        error: { code: ErrorCode.Conflict, message: 'You already have a provider profile.' },
      });
    }

    const isRider = dto.providerType === ProviderType.independent_rider;
    const isCompany = COMPANY_TYPES.includes(dto.providerType);

    const data: Prisma.ProviderProfileCreateInput = {
      user: { connect: { id: userId } },
      providerType: dto.providerType,
      displayName: dto.displayName,
      description: dto.description,
      phoneNumber: dto.phoneNumber,
      baseCountry: dto.baseCountry ?? 'Cameroon',
      ...(isRider && {
        baseCity: dto.baseCity,
        serviceCoverage: dto.serviceCoverage,
      }),
      ...(isCompany && {
        businessAddress: dto.businessAddress,
        ...(dto.businessLat != null && { businessLat: dto.businessLat }),
        ...(dto.businessLng != null && { businessLng: dto.businessLng }),
      }),
    };

    const profile = await this.prisma.providerProfile.create({ data });
    return toPrivateResponse(profile);
  }

  async findAll(query: ListProvidersQueryDto) {
    const where: Prisma.ProviderProfileWhereInput = {
      deletedAt: null,
      ...(query.providerType && { providerType: query.providerType }),
      ...(query.baseCity && {
        baseCity: { contains: query.baseCity, mode: Prisma.QueryMode.insensitive },
      }),
      ...(query.verificationStatus && { verificationStatus: query.verificationStatus }),
      ...(query.availabilityStatus && { availabilityStatus: query.availabilityStatus }),
      ...(query.isFeatured !== undefined && { isFeatured: query.isFeatured }),
    };

    const [items, total] = await Promise.all([
      this.prisma.providerProfile.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { ratingAverage: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.providerProfile.count({ where }),
    ]);

    // Batch-fetch recent reviews for all providers in this page (single query, not N+1)
    const providerIds = items.map((p) => p.id);
    const allReviews = providerIds.length > 0
      ? await this.prisma.reviewRating.findMany({
          where: { providerProfileId: { in: providerIds }, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          select: { providerProfileId: true, rating: true, comment: true, createdAt: true },
        })
      : [];

    const reviewsByProvider = new Map<string, typeof allReviews>();
    for (const r of allReviews) {
      if (!r.providerProfileId) continue;
      const bucket = reviewsByProvider.get(r.providerProfileId) ?? [];
      if (bucket.length < 2) bucket.push(r);
      reviewsByProvider.set(r.providerProfileId, bucket);
    }

    return {
      items: items.map((p) => ({
        ...toPublicResponse(p),
        recentReviews: (reviewsByProvider.get(p.id) ?? []).map((r) => ({
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
        })),
      })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findOnePublic(id: string) {
    const profile = await this.prisma.providerProfile.findFirst({
      where: { id, deletedAt: null },
    });
    if (!profile) {
      throw new NotFoundException({
        success: false,
        error: { code: ErrorCode.ResourceNotFound, message: 'Provider profile not found.' },
      });
    }
    return toPublicResponse(profile);
  }

  async findMyProfile(userId: string) {
    const profile = await this.requireProfile(userId);
    return toPrivateResponse(profile);
  }

  async update(userId: string, dto: UpdateProviderProfileDto) {
    const profile = await this.requireProfile(userId);

    const isRider = profile.providerType === ProviderType.independent_rider;
    const isCompany = COMPANY_TYPES.includes(profile.providerType);

    const data: Prisma.ProviderProfileUpdateInput = {
      ...(dto.displayName !== undefined && { displayName: dto.displayName }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
      ...(dto.baseCountry !== undefined && { baseCountry: dto.baseCountry }),
      ...(isRider && dto.baseCity !== undefined && { baseCity: dto.baseCity }),
      ...(isRider && dto.serviceCoverage !== undefined && { serviceCoverage: dto.serviceCoverage }),
      ...(isCompany && dto.businessAddress !== undefined && { businessAddress: dto.businessAddress }),
      ...(isCompany && dto.businessLat !== undefined && { businessLat: dto.businessLat }),
      ...(isCompany && dto.businessLng !== undefined && { businessLng: dto.businessLng }),
    };

    const updated = await this.prisma.providerProfile.update({
      where: { id: profile.id },
      data,
    });
    return toPrivateResponse(updated);
  }

  async updateAvailability(userId: string, dto: UpdateAvailabilityDto) {
    const profile = await this.requireProfile(userId);
    const updated = await this.prisma.providerProfile.update({
      where: { id: profile.id },
      data: { availabilityStatus: dto.availabilityStatus },
    });
    return toPrivateResponse(updated);
  }

  async updateVerification(profileId: string, dto: UpdateVerificationDto) {
    const profile = await this.prisma.providerProfile.findFirst({
      where: { id: profileId, deletedAt: null },
    });
    if (!profile) {
      throw new NotFoundException({
        success: false,
        error: { code: ErrorCode.ResourceNotFound, message: 'Provider profile not found.' },
      });
    }
    const updated = await this.prisma.providerProfile.update({
      where: { id: profileId },
      data: { verificationStatus: dto.verificationStatus },
    });
    return toAdminResponse(updated);
  }

  // ── Dashboard stats ───────────────────────────────────────────────────────

  async getStats(userId: string) {
    const profile = await this.requireProfile(userId);

    const ACTIVE_STATUSES = ['provider_assigned', 'pickup_verified', 'in_transit'];
    const DONE_STATUSES = ['delivered', 'completed'];

    const [activeRequests, completedRequests, pendingOffers] = await Promise.all([
      this.prisma.deliveryRequest.count({
        where: {
          selectedProviderProfileId: profile.id,
          requestStatus: { in: ACTIVE_STATUSES as any[] },
          deletedAt: null,
        },
      }),
      this.prisma.deliveryRequest.count({
        where: {
          selectedProviderProfileId: profile.id,
          requestStatus: { in: DONE_STATUSES as any[] },
          deletedAt: null,
        },
      }),
      this.prisma.marketplaceOffer.count({
        where: {
          providerProfileId: profile.id,
          offerStatus: 'submitted',
          deletedAt: null,
        },
      }),
    ]);

    return {
      activeRequests,
      completedRequests,
      totalRequests: activeRequests + completedRequests,
      pendingOffers,
      ratingAverage: profile.ratingAverage.toNumber(),
      ratingCount: profile.ratingCount,
      providerType: profile.providerType,
      availabilityStatus: profile.availabilityStatus,
    };
  }

  // ── Verification Records ──────────────────────────────────────────────────

  async submitVerificationRecord(userId: string, dto: CreateVerificationRecordDto) {
    const profile = await this.requireProfile(userId);

    const fileExists = await this.prisma.uploadedFile.findFirst({
      where: { id: dto.fileId, uploadedByUserId: userId, deletedAt: null },
      select: { id: true },
    });
    if (!fileExists) throw new BadRequestException({ success: false, error: { code: ErrorCode.ValidationError, message: 'File not found or not owned by you.' } });

    const existing = await this.prisma.verificationRecord.findFirst({
      where: { providerProfileId: profile.id, verificationType: dto.verificationType as any, deletedAt: null },
    });
    if (existing) {
      // Update existing record (re-submit)
      const updated = await this.prisma.verificationRecord.update({
        where: { id: existing.id },
        data: { documentFileId: dto.fileId, submittedValue: dto.submittedValue ?? null, status: 'pending', reviewerUserId: null, reviewedAt: null, rejectionReason: null },
      });
      return this.formatVerificationRecord(updated);
    }

    // First submission — transition profile to pending
    const record = await this.prisma.$transaction(async (tx) => {
      const r = await tx.verificationRecord.create({
        data: {
          providerProfileId: profile.id,
          userId,
          verificationType: dto.verificationType as any,
          documentFileId: dto.fileId,
          submittedValue: dto.submittedValue ?? null,
          status: 'pending',
        },
      });
      if (profile.verificationStatus === 'unverified') {
        await tx.providerProfile.update({ where: { id: profile.id }, data: { verificationStatus: 'pending' } });
      }
      return r;
    });

    void this.notifications.notifyCustomerService({
      event: 'VERIFICATION_SUBMITTED',
      notes: `Provider ${profile.displayName} submitted ${dto.verificationType} document for review.`,
    });

    return this.formatVerificationRecord(record);
  }

  async getMyVerificationRecords(userId: string) {
    const profile = await this.requireProfile(userId);
    const records = await this.prisma.verificationRecord.findMany({
      where: { providerProfileId: profile.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.formatVerificationRecord(r));
  }

  private formatVerificationRecord(r: any) {
    return {
      id: r.id,
      verificationType: r.verificationType,
      status: r.status,
      documentFileId: r.documentFileId,
      submittedValue: r.submittedValue,
      rejectionReason: r.rejectionReason,
      approvalNotes: r.approvalNotes,
      reviewedAt: r.reviewedAt,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  // ── Company: list agents (riders) ──────────────────────────────────────────

  async getMyAgents(userId: string) {
    const profile = await this.requireProfile(userId);

    if (!COMPANY_TYPES.includes(profile.providerType)) {
      throw new ForbiddenException({
        success: false,
        error: { code: ErrorCode.Forbidden, message: 'Only company providers can access agent management.' },
      });
    }

    if (!profile.agencyId) {
      return [];
    }

    const riders = await this.prisma.rider.findMany({
      where: { agencyId: profile.agencyId, deletedAt: null },
      include: {
        dispatches: {
          where: {
            assignmentStatus: { in: ['assigned', 'accepted', 'in_progress'] },
            deletedAt: null,
          },
          select: { id: true },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    return riders.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      phone: r.phone,
      vehicleType: r.vehicleType,
      availabilityStatus: r.availabilityStatus,
      verificationStatus: r.verificationStatus,
      currentWorkload: r.currentWorkload,
      activeDispatches: r.dispatches.length,
      lastSeenAt: r.lastSeenAt,
    }));
  }

  // ── Company Branch Locations ───────────────────────────────────────────────

  async createBranch(userId: string, dto: CreateBranchDto) {
    const profile = await this.requireProfile(userId);
    if (!COMPANY_TYPES.includes(profile.providerType)) {
      throw new ForbiddenException({ success: false, error: { code: ErrorCode.Forbidden, message: 'Only company providers can manage branch locations.' } });
    }

    const quarter = await this.prisma.quarter.findFirst({
      where: { id: dto.quarterId },
      select: { id: true, name: true, town: { select: { id: true, name: true, region: { select: { name: true } } } } },
    });
    if (!quarter) throw new BadRequestException({ success: false, error: { code: ErrorCode.ValidationError, message: 'Quarter not found.' } });

    const branch = await this.prisma.providerBranch.create({
      data: {
        providerProfileId: profile.id,
        quarterId: dto.quarterId,
        name: dto.name,
        phoneNumber: dto.phoneNumber ?? null,
        isHeadquarters: dto.isHeadquarters ?? false,
      },
    });
    return this.formatBranch(branch, quarter);
  }

  async getMyBranches(userId: string) {
    const profile = await this.requireProfile(userId);
    const branches = await this.prisma.providerBranch.findMany({
      where: { providerProfileId: profile.id, deletedAt: null },
      include: { quarter: { include: { town: { include: { region: { select: { name: true } } } } } } },
      orderBy: [{ isHeadquarters: 'desc' }, { createdAt: 'asc' }],
    });
    return branches.map((b) => this.formatBranch(b, b.quarter));
  }

  async deleteBranch(userId: string, branchId: string) {
    const profile = await this.requireProfile(userId);
    const branch = await this.prisma.providerBranch.findFirst({
      where: { id: branchId, providerProfileId: profile.id, deletedAt: null },
    });
    if (!branch) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Branch not found.' } });
    await this.prisma.providerBranch.update({ where: { id: branchId }, data: { deletedAt: new Date(), isActive: false } });
    return { success: true };
  }

  async getBranchStats(userId: string, branchId: string) {
    const profile = await this.requireProfile(userId);
    const branch = await this.prisma.providerBranch.findFirst({
      where: { id: branchId, providerProfileId: profile.id, deletedAt: null },
      include: { quarter: { include: { town: { include: { region: { select: { name: true } } } } } } },
    });
    if (!branch) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Branch not found.' } });

    const townId = branch.quarter.townId;
    const ACTIVE = ['provider_assigned', 'pickup_verified', 'in_transit'];
    const DONE = ['delivered', 'completed'];

    const [activeRequests, completedDeliveries] = await Promise.all([
      this.prisma.deliveryRequest.count({
        where: {
          selectedProviderProfileId: profile.id,
          requestStatus: { in: ACTIVE as any[] },
          deletedAt: null,
          OR: [
            { route: { pickupQuarter: { townId } } },
            { route: { destinationQuarter: { townId } } },
          ],
        },
      }),
      this.prisma.deliveryRequest.count({
        where: {
          selectedProviderProfileId: profile.id,
          requestStatus: { in: DONE as any[] },
          deletedAt: null,
          OR: [
            { route: { pickupQuarter: { townId } } },
            { route: { destinationQuarter: { townId } } },
          ],
        },
      }),
    ]);

    return {
      branchId: branch.id,
      name: branch.name,
      isHeadquarters: branch.isHeadquarters,
      isActive: branch.isActive,
      phoneNumber: branch.phoneNumber,
      location: `${branch.quarter.name}, ${branch.quarter.town.name}, ${branch.quarter.town.region.name}`,
      townId,
      activeRequests,
      completedDeliveries,
    };
  }

  private formatBranch(branch: any, quarter: any) {
    return {
      id: branch.id,
      name: branch.name,
      phoneNumber: branch.phoneNumber,
      isHeadquarters: branch.isHeadquarters,
      isActive: branch.isActive,
      quarterId: branch.quarterId ?? quarter.id,
      quarterName: quarter.name,
      townName: quarter.town?.name ?? '',
      regionName: quarter.town?.region?.name ?? '',
      location: `${quarter.name}, ${quarter.town?.name ?? ''}, ${quarter.town?.region?.name ?? ''}`,
      createdAt: branch.createdAt,
    };
  }

  // ── Rider Planned Routes ───────────────────────────────────────────────────

  async createRiderRoute(userId: string, dto: CreateRiderRouteDto) {
    const profile = await this.requireProfile(userId);
    if (profile.providerType !== ProviderType.independent_rider) {
      throw new ForbiddenException({ success: false, error: { code: ErrorCode.Forbidden, message: 'Only independent riders can create planned routes.' } });
    }

    const [originQ, destinationQ] = await Promise.all([
      this.prisma.quarter.findFirst({ where: { id: dto.originQuarterId }, include: { town: { include: { region: { select: { name: true } } } } } }),
      this.prisma.quarter.findFirst({ where: { id: dto.destinationQuarterId }, include: { town: { include: { region: { select: { name: true } } } } } }),
    ]);
    if (!originQ) throw new BadRequestException({ success: false, error: { code: ErrorCode.ValidationError, message: 'Origin quarter not found.' } });
    if (!destinationQ) throw new BadRequestException({ success: false, error: { code: ErrorCode.ValidationError, message: 'Destination quarter not found.' } });

    const route = await this.prisma.riderRoute.create({
      data: {
        providerProfileId: profile.id,
        originQuarterId: dto.originQuarterId,
        destinationQuarterId: dto.destinationQuarterId,
        departureTime: dto.departureTime ?? null,
        isRecurring: dto.isRecurring ?? false,
        recurringDays: dto.recurringDays ?? [],
      },
    });
    return this.formatRiderRoute(route, originQ, destinationQ);
  }

  async getMyRiderRoutes(userId: string) {
    const profile = await this.requireProfile(userId);
    const routes = await this.prisma.riderRoute.findMany({
      where: { providerProfileId: profile.id, deletedAt: null },
      include: {
        originQuarter: { include: { town: { include: { region: { select: { name: true } } } } } },
        destinationQuarter: { include: { town: { include: { region: { select: { name: true } } } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return routes.map((r) => this.formatRiderRoute(r, r.originQuarter, r.destinationQuarter));
  }

  async deleteRiderRoute(userId: string, routeId: string) {
    const profile = await this.requireProfile(userId);
    const route = await this.prisma.riderRoute.findFirst({
      where: { id: routeId, providerProfileId: profile.id, deletedAt: null },
    });
    if (!route) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Route not found.' } });
    await this.prisma.riderRoute.update({ where: { id: routeId }, data: { deletedAt: new Date(), isActive: false } });
    return { success: true };
  }

  async getRouteMatchingJobs(userId: string, routeId: string) {
    const profile = await this.requireProfile(userId);
    const route = await this.prisma.riderRoute.findFirst({
      where: { id: routeId, providerProfileId: profile.id, deletedAt: null },
      include: {
        originQuarter: { select: { townId: true, name: true, town: { select: { name: true } } } },
        destinationQuarter: { select: { townId: true, name: true, town: { select: { name: true } } } },
      },
    });
    if (!route) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Route not found.' } });

    const originTownId = route.originQuarter.townId;
    const destinationTownId = route.destinationQuarter.townId;

    const OPEN_STATUSES = ['created', 'marketplace_open', 'offers_received'];

    const requests = await this.prisma.deliveryRequest.findMany({
      where: {
        deletedAt: null,
        requestStatus: { in: OPEN_STATUSES as any[] },
        route: {
          pickupQuarter: { townId: originTownId },
          destinationQuarter: { townId: destinationTownId },
        },
      },
      include: {
        route: {
          include: {
            pickupQuarter: { include: { town: { include: { region: { select: { name: true } } } } } },
            destinationQuarter: { include: { town: { include: { region: { select: { name: true } } } } } },
          },
        },
        items: { select: { itemName: true, category: true, quantity: true, isFragile: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const formatLocation = (q: any) => q ? `${q.name}, ${q.town?.name ?? ''}, ${q.town?.region?.name ?? ''}` : '';

    return {
      routeId: route.id,
      originTown: route.originQuarter.town?.name ?? '',
      destinationTown: route.destinationQuarter.town?.name ?? '',
      matchingJobs: requests.map((req) => ({
        id: req.id,
        trackingCode: req.publicTrackingCode,
        requestStatus: req.requestStatus,
        deliveryType: req.deliveryType,
        desiredRewardAmount: req.desiredRewardAmount ? Number(req.desiredRewardAmount) : null,
        estimatedDeliveryCost: req.deliveryCost ? Number(req.deliveryCost) : null,
        createdAt: req.createdAt,
        route: req.route ? {
          pickup: formatLocation(req.route.pickupQuarter),
          pickupLandmark: req.route.pickupLandmark ?? '',
          destination: formatLocation(req.route.destinationQuarter),
          destinationLandmark: req.route.destinationLandmark ?? '',
        } : null,
        items: {
          count: req.items.length,
          hasFragile: req.items.some((i: any) => i.isFragile),
          summary: req.items.map((i: any) => i.itemName).slice(0, 3).join(', '),
        },
      })),
    };
  }

  private formatRiderRoute(route: any, originQ: any, destinationQ: any) {
    return {
      id: route.id,
      originQuarterId: route.originQuarterId,
      originQuarterName: originQ.name,
      originTownName: originQ.town?.name ?? '',
      originRegionName: originQ.town?.region?.name ?? '',
      originLabel: `${originQ.name}, ${originQ.town?.name ?? ''}`,
      destinationQuarterId: route.destinationQuarterId,
      destinationQuarterName: destinationQ.name,
      destinationTownName: destinationQ.town?.name ?? '',
      destinationRegionName: destinationQ.town?.region?.name ?? '',
      destinationLabel: `${destinationQ.name}, ${destinationQ.town?.name ?? ''}`,
      departureTime: route.departureTime,
      isRecurring: route.isRecurring,
      recurringDays: route.recurringDays ?? [],
      isActive: route.isActive,
      createdAt: route.createdAt,
    };
  }
}
