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
