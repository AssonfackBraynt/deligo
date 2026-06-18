import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProviderProfile, ProviderType, VerificationStatus } from '@prisma/client';
import { ErrorCode } from '@common/errors/error-codes';
import { PrismaService } from '@database/prisma.service';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import { ListProvidersQueryDto } from './dto/list-providers-query.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';

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
  constructor(private readonly prisma: PrismaService) {}

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

    return { items: items.map(toPublicResponse), total, page: query.page, limit: query.limit };
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
    const profile = await this.prisma.providerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!profile) {
      throw new NotFoundException({
        success: false,
        error: { code: ErrorCode.ResourceNotFound, message: 'You do not have a provider profile yet.' },
      });
    }
    return toPrivateResponse(profile);
  }

  async update(userId: string, dto: UpdateProviderProfileDto) {
    const profile = await this.prisma.providerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!profile) {
      throw new NotFoundException({
        success: false,
        error: { code: ErrorCode.ResourceNotFound, message: 'You do not have a provider profile yet.' },
      });
    }

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
    const profile = await this.prisma.providerProfile.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    if (!profile) {
      throw new NotFoundException({
        success: false,
        error: { code: ErrorCode.ResourceNotFound, message: 'You do not have a provider profile yet.' },
      });
    }
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
}
