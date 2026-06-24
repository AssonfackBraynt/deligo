import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ok } from '@common/dto/api-response.dto';
import { LocationService } from './location.service';

@ApiTags('Locations')
@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('public-stats')
  @Public()
  @ApiOperation({ summary: 'Public homepage stats: completed deliveries, verified providers, total quarters' })
  async getPublicStats() {
    const data = await this.locationService.getPublicStats();
    return ok(data);
  }

  @Get('regions')
  @Public()
  @ApiOperation({ summary: 'List all regions' })
  async listRegions() {
    const data = await this.locationService.listRegions();
    return ok(data);
  }

  @Get('towns')
  @Public()
  @ApiOperation({ summary: 'List all towns' })
  async listTowns() {
    const data = await this.locationService.listTowns();
    return ok(data);
  }

  @Get('regions/:regionId/quarters')
  @Public()
  @ApiOperation({ summary: 'List quarters in a region, optionally filtered by name search' })
  @ApiQuery({ name: 'search', required: false })
  async listQuarters(
    @Param('regionId', ParseUUIDPipe) regionId: string,
    @Query('search') search?: string,
  ) {
    const data = await this.locationService.listQuartersByRegion(regionId, search);
    return ok(data);
  }
}
