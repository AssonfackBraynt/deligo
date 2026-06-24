import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '@database/prisma.service';
import { ErrorCode } from '@common/errors/error-codes';
import { DeliGoGateway } from '../gateway/deligo.gateway';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: DeliGoGateway,
  ) {}

  // ── Dashboard stats ───────────────────────────────────────────────────────

  async getStats() {
    const [
      totalProviders,
      pendingVerifications,
      verifiedProviders,
      activeRequests,
      openMarketplaceRequests,
      completedDeliveries,
      totalRatings,
      totalNotifications,
      totalUsers,
    ] = await Promise.all([
      this.prisma.providerProfile.count({ where: { deletedAt: null } }),
      this.prisma.providerProfile.count({ where: { verificationStatus: 'pending', deletedAt: null } }),
      this.prisma.providerProfile.count({ where: { verificationStatus: 'verified', deletedAt: null } }),
      this.prisma.deliveryRequest.count({ where: { requestStatus: { in: ['provider_assigned', 'pickup_verified', 'in_transit'] as any[] }, deletedAt: null } }),
      this.prisma.deliveryRequest.count({ where: { fulfillmentMode: 'open_marketplace', requestStatus: { in: ['created', 'offers_received'] as any[] }, deletedAt: null } }),
      this.prisma.deliveryRequest.count({ where: { requestStatus: { in: ['delivered', 'completed'] as any[] }, deletedAt: null } }),
      this.prisma.reviewRating.count({ where: { deletedAt: null } }),
      this.prisma.notification.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);

    return {
      totalProviders,
      pendingVerifications,
      verifiedProviders,
      activeRequests,
      openMarketplaceRequests,
      completedDeliveries,
      totalRatings,
      totalNotifications,
      totalUsers,
    };
  }

  // ── Provider management ───────────────────────────────────────────────────

  async listProviders(query: {
    page?: number;
    limit?: number;
    providerType?: string;
    verificationStatus?: string;
    search?: string;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (query.providerType) where.providerType = query.providerType;
    if (query.verificationStatus) where.verificationStatus = query.verificationStatus;
    if (query.search) {
      where.OR = [
        { displayName: { contains: query.search, mode: 'insensitive' } },
        { phoneNumber: { contains: query.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.providerProfile.findMany({
        where,
        include: { user: { select: { id: true, fullName: true, phone: true, email: true, accountStatus: true } } },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.providerProfile.count({ where }),
    ]);

    return {
      items: items.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        providerType: p.providerType,
        verificationStatus: p.verificationStatus,
        availabilityStatus: p.availabilityStatus,
        baseCity: p.baseCity,
        ratingAverage: Number(p.ratingAverage),
        ratingCount: p.ratingCount,
        isFeatured: p.isFeatured,
        createdAt: p.createdAt,
        user: p.user,
      })),
      total,
      page,
      limit,
    };
  }

  async getProviderDetail(profileId: string) {
    const profile = await this.prisma.providerProfile.findFirst({
      where: { id: profileId, deletedAt: null },
      include: {
        user: { select: { id: true, fullName: true, phone: true, email: true, accountStatus: true, createdAt: true } },
      },
    });
    if (!profile) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Provider not found.' } });

    const [verificationRecords, recentRequests, ratingStats] = await Promise.all([
      this.prisma.verificationRecord.findMany({
        where: { providerProfileId: profileId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.deliveryRequest.findMany({
        where: { selectedProviderProfileId: profileId, deletedAt: null },
        select: { id: true, publicTrackingCode: true, requestStatus: true, deliveryType: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.reviewRating.aggregate({
        where: { providerProfileId: profileId, deletedAt: null },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    return {
      id: profile.id,
      displayName: profile.displayName,
      providerType: profile.providerType,
      description: profile.description,
      phoneNumber: profile.phoneNumber,
      baseCity: profile.baseCity,
      businessAddress: profile.businessAddress,
      verificationStatus: profile.verificationStatus,
      availabilityStatus: profile.availabilityStatus,
      isFeatured: profile.isFeatured,
      ratingAverage: Number(profile.ratingAverage),
      ratingCount: profile.ratingCount,
      createdAt: profile.createdAt,
      user: profile.user,
      verificationRecords: verificationRecords.map((r) => ({
        id: r.id,
        verificationType: r.verificationType,
        status: r.status,
        documentFileId: r.documentFileId,
        submittedValue: r.submittedValue,
        rejectionReason: r.rejectionReason,
        approvalNotes: r.approvalNotes,
        reviewedAt: r.reviewedAt,
        createdAt: r.createdAt,
      })),
      recentRequests,
      reviewStats: {
        averageRating: ratingStats._avg.rating ?? 0,
        totalReviews: ratingStats._count.rating,
      },
    };
  }

  // ── Verification queue ────────────────────────────────────────────────────

  async listVerificationQueue(status?: string) {
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    else where.status = 'pending';

    const records = await this.prisma.verificationRecord.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    // Fetch provider info manually
    const profileIds = [...new Set(records.filter((r) => r.providerProfileId).map((r) => r.providerProfileId!))];
    const profiles = profileIds.length
      ? await this.prisma.providerProfile.findMany({
          where: { id: { in: profileIds } },
          select: { id: true, displayName: true, providerType: true, verificationStatus: true },
        })
      : [];

    const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));

    return records.map((r) => ({
      id: r.id,
      verificationType: r.verificationType,
      status: r.status,
      documentFileId: r.documentFileId,
      submittedValue: r.submittedValue,
      rejectionReason: r.rejectionReason,
      approvalNotes: r.approvalNotes,
      reviewedAt: r.reviewedAt,
      createdAt: r.createdAt,
      provider: r.providerProfileId ? profileMap[r.providerProfileId] ?? null : null,
    }));
  }

  async reviewVerificationRecord(recordId: string, adminUserId: string, dto: { status: 'approved' | 'rejected'; rejectionReason?: string; approvalNotes?: string }) {
    const record = await this.prisma.verificationRecord.findFirst({ where: { id: recordId, deletedAt: null } });
    if (!record) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Verification record not found.' } });

    const updated = await this.prisma.verificationRecord.update({
      where: { id: recordId },
      data: {
        status: dto.status as any,
        reviewerUserId: adminUserId,
        reviewedAt: new Date(),
        rejectionReason: dto.rejectionReason ?? null,
        approvalNotes: dto.approvalNotes ?? null,
      },
    });

    return {
      id: updated.id,
      verificationType: updated.verificationType,
      status: updated.status,
      reviewedAt: updated.reviewedAt,
    };
  }

  // ── Delivery monitoring ───────────────────────────────────────────────────

  async listDeliveryRequests(query: { page?: number; limit?: number; status?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (query.status) where.requestStatus = query.status;

    const [items, total] = await Promise.all([
      this.prisma.deliveryRequest.findMany({
        where,
        include: {
          customerContact: { select: { fullName: true, whatsappNumber: true } },
          selectedProvider: { select: { displayName: true, providerType: true } },
          route: {
            include: {
              pickupQuarter: { include: { town: true } },
              destinationQuarter: { include: { town: true } },
            },
          },
          items: { select: { itemName: true } },
          _count: { select: { trackingEvents: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.deliveryRequest.count({ where }),
    ]);

    return {
      items: items.map((r) => ({
        id: r.id,
        trackingCode: r.publicTrackingCode,
        requestStatus: r.requestStatus,
        fulfillmentMode: r.fulfillmentMode,
        deliveryType: r.deliveryType,
        estimatedCost: r.deliveryCost ? Number(r.deliveryCost) : null,
        customerName: r.customerContact.fullName,
        customerWhatsapp: r.customerContact.whatsappNumber,
        providerName: r.selectedProvider?.displayName ?? null,
        pickup: r.route ? `${r.route.pickupQuarter.name}, ${r.route.pickupQuarter.town.name}` : null,
        destination: r.route ? `${r.route.destinationQuarter.name}, ${r.route.destinationQuarter.town.name}` : null,
        itemCount: r.items.length,
        trackingEventCount: r._count.trackingEvents,
        createdAt: r.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getRequestTracking(trackingCode: string) {
    const request = await this.prisma.deliveryRequest.findFirst({
      where: { publicTrackingCode: trackingCode.toUpperCase(), deletedAt: null },
      include: {
        trackingEvents: {
          orderBy: { occurredAt: 'asc' },
          include: { responsibleProviderProfile: { select: { displayName: true } } },
        },
        offers: { where: { deletedAt: null }, include: { providerProfile: { select: { displayName: true } } } },
        customerContact: { select: { fullName: true, whatsappNumber: true } },
        selectedProvider: { select: { displayName: true, providerType: true } },
      },
    });
    if (!request) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'Request not found.' } });

    return {
      id: request.id,
      trackingCode: request.publicTrackingCode,
      requestStatus: request.requestStatus,
      fulfillmentMode: request.fulfillmentMode,
      customer: request.customerContact,
      provider: request.selectedProvider,
      events: request.trackingEvents.map((e) => ({
        eventType: e.eventType,
        statusAfterEvent: e.statusAfterEvent,
        provider: e.responsibleProviderProfile?.displayName ?? null,
        notes: e.notes,
        occurredAt: e.occurredAt,
      })),
      offers: request.offers.map((o) => ({
        id: o.id,
        provider: o.providerProfile?.displayName ?? null,
        amount: Number(o.offerAmount),
        status: o.offerStatus,
        submittedAt: o.submittedAt,
      })),
    };
  }

  // ── User management ───────────────────────────────────────────────────────

  async listUsers(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          roles: { include: { role: { select: { code: true } } } },
          providerProfile: { select: { id: true, displayName: true, verificationStatus: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        phone: u.phone,
        email: u.email,
        accountStatus: u.accountStatus,
        roles: u.roles.map((r) => r.role.code),
        providerProfile: u.providerProfile,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      })),
      total,
      page,
      limit,
    };
  }

  async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'deactivated', suspensionReason?: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null }, select: { id: true } });
    if (!user) throw new NotFoundException({ success: false, error: { code: ErrorCode.ResourceNotFound, message: 'User not found.' } });

    await (this.prisma.user.update as any)({
      where: { id: userId },
      data: {
        accountStatus: status,
        suspensionReason: status === 'suspended' ? (suspensionReason ?? null) : null,
      },
    });
    this.gateway.emitAdminStatsChanged();
    return { success: true, message: `User status updated to ${status}.` };
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  async listNotifications(query: { page?: number; limit?: number; type?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 30;
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (query.type) where.notificationType = query.type;

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  // ── Dashboard chart data ──────────────────────────────────────────────────

  async getChartData() {
    // Build last 7 day labels
    const days: { label: string; start: Date; end: Date }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const label = d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' });
      const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
      const end   = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
      days.push({ label, start, end });
    }

    const [deliveryRows, userRows, providerTypes, statusCounts] = await Promise.all([
      // Deliveries per day (last 7 days)
      Promise.all(
        days.map((d) =>
          this.prisma.deliveryRequest.count({
            where: { createdAt: { gte: d.start, lte: d.end }, deletedAt: null },
          }),
        ),
      ),
      // New users per day (last 7 days)
      Promise.all(
        days.map((d) =>
          this.prisma.user.count({
            where: { createdAt: { gte: d.start, lte: d.end }, deletedAt: null },
          }),
        ),
      ),
      // Provider type breakdown
      this.prisma.providerProfile.groupBy({
        by: ['providerType'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      // Delivery status distribution
      this.prisma.deliveryRequest.groupBy({
        by: ['requestStatus'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
    ]);

    const trend = days.map((d, i) => ({
      day: d.label,
      deliveries: deliveryRows[i],
      users: userRows[i],
    }));

    const providerBreakdown = providerTypes.map((r) => ({
      name: r.providerType.replace('_', ' '),
      value: r._count._all,
    }));

    const STATUS_LABEL: Record<string, string> = {
      created: 'Created',
      offers_received: 'Offers',
      provider_assigned: 'Assigned',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      completed: 'Completed',
      cancelled: 'Cancelled',
      disputed: 'Disputed',
    };

    const statusBreakdown = statusCounts
      .filter((r) => r._count._all > 0)
      .map((r) => ({
        name: STATUS_LABEL[r.requestStatus as string] ?? r.requestStatus,
        value: r._count._all,
      }));

    return { trend, providerBreakdown, statusBreakdown };
  }

  // ── Administrative report ─────────────────────────────────────────────────

  async getReport(startDate: Date, endDate: Date) {
    const range = { gte: startDate, lte: endDate };

    const [
      newDeliveries,
      completedDeliveries,
      cancelledDeliveries,
      disputedDeliveries,
      activeDeliveries,
      newUsers,
      newProviders,
      verifiedProviders,
      verificationSubmitted,
      verificationApproved,
      verificationRejected,
      reviewsInPeriod,
      reviewsAggregate,
    ] = await Promise.all([
      this.prisma.deliveryRequest.count({ where: { createdAt: range, deletedAt: null } }),
      this.prisma.deliveryRequest.count({ where: { createdAt: range, requestStatus: { in: ['delivered', 'completed'] as any[] }, deletedAt: null } }),
      this.prisma.deliveryRequest.count({ where: { createdAt: range, requestStatus: 'cancelled' as any, deletedAt: null } }),
      this.prisma.deliveryRequest.count({ where: { createdAt: range, requestStatus: 'disputed' as any, deletedAt: null } }),
      this.prisma.deliveryRequest.count({ where: { createdAt: range, requestStatus: { in: ['provider_assigned', 'in_transit'] as any[] }, deletedAt: null } }),
      this.prisma.user.count({ where: { createdAt: range, deletedAt: null } }),
      this.prisma.providerProfile.count({ where: { createdAt: range, deletedAt: null } }),
      this.prisma.providerProfile.count({ where: { updatedAt: range, verificationStatus: 'verified', deletedAt: null } }),
      this.prisma.verificationRecord.count({ where: { createdAt: range } }),
      this.prisma.verificationRecord.count({ where: { reviewedAt: range, status: 'approved' } }),
      this.prisma.verificationRecord.count({ where: { reviewedAt: range, status: 'rejected' } }),
      this.prisma.reviewRating.count({ where: { createdAt: range, deletedAt: null } }),
      this.prisma.reviewRating.aggregate({ where: { createdAt: range, deletedAt: null }, _avg: { rating: true } }),
    ]);

    const diffMs = endDate.getTime() - startDate.getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;

    return {
      period: {
        from: startDate.toISOString().slice(0, 10),
        to: endDate.toISOString().slice(0, 10),
        days,
      },
      deliveries: {
        new: newDeliveries,
        completed: completedDeliveries,
        active: activeDeliveries,
        cancelled: cancelledDeliveries,
        disputed: disputedDeliveries,
      },
      users: {
        newRegistrations: newUsers,
      },
      providers: {
        newRegistrations: newProviders,
        verifiedInPeriod: verifiedProviders,
      },
      verifications: {
        submitted: verificationSubmitted,
        approved: verificationApproved,
        rejected: verificationRejected,
      },
      reviews: {
        count: reviewsInPeriod,
        averageRating: reviewsAggregate._avg.rating
          ? Math.round(reviewsAggregate._avg.rating * 10) / 10
          : null,
      },
    };
  }

  // ── One-time bootstrap ────────────────────────────────────────────────────

  async bootstrapAdmin(dto: { fullName: string; phone: string; email: string; password: string }) {
    // Self-disable: if any admin already exists, reject unconditionally
    const adminCount = await this.prisma.userRole.count({
      where: { role: { code: 'admin' } },
    });
    if (adminCount > 0) {
      throw new ForbiddenException('Bootstrap is permanently disabled — an admin already exists.');
    }

    // Check no duplicate phone/email
    const duplicate = await this.prisma.user.findFirst({
      where: { OR: [{ phone: dto.phone }, { email: dto.email }], deletedAt: null },
    });
    if (duplicate) {
      throw new ConflictException('A user with this phone or email already exists.');
    }

    // Ensure the admin role row exists
    let adminRole = await this.prisma.role.findFirst({ where: { code: 'admin' } });
    if (!adminRole) {
      adminRole = await this.prisma.role.create({
        data: { code: 'admin', name: 'Administrator', description: 'Full access to DeliGo admin portal.' },
      });
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        accountStatus: 'active',
        phoneVerifiedAt: new Date(),
        roles: { create: { roleId: adminRole.id } },
      },
      select: { id: true, fullName: true, phone: true, email: true, createdAt: true },
    });

    return {
      message: 'Admin created. Remove ADMIN_BOOTSTRAP_SECRET from your environment now.',
      user,
    };
  }
}
