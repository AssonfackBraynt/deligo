import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  async listRegions() {
    return this.prisma.region.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  async getPublicStats() {
    const [totalDeliveries, totalCarriers, totalQuarters] = await Promise.all([
      this.prisma.deliveryRequest.count({ where: { deletedAt: null } }),
      this.prisma.providerProfile.count({ where: { deletedAt: null } }),
      this.prisma.quarter.count(),
    ]);
    return { totalDeliveries, totalCarriers, totalQuarters };
  }

  async listTowns() {
    return this.prisma.town.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  async listQuartersByRegion(regionId: string, search?: string) {
    return this.prisma.quarter.findMany({
      where: {
        town: { regionId },
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      select: {
        id: true,
        name: true,
        town: { select: { id: true, name: true } },
      },
      orderBy: [{ town: { name: 'asc' } }, { name: 'asc' }],
    });
  }
}
