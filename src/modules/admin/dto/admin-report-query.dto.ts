import { BadRequestException } from '@nestjs/common';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export type ReportPreset = 'day' | '7d' | '15d' | '30d' | '6m' | '1y' | 'custom';

export class AdminReportQueryDto {
  @IsEnum(['day', '7d', '15d', '30d', '6m', '1y', 'custom'])
  preset: ReportPreset;

  /** For preset=day: specific date (defaults to today). ISO date string YYYY-MM-DD */
  @IsOptional()
  @IsDateString()
  date?: string;

  /** For preset=custom: start date (inclusive). ISO date string YYYY-MM-DD */
  @IsOptional()
  @IsDateString()
  from?: string;

  /** For preset=custom: end date (inclusive). ISO date string YYYY-MM-DD */
  @IsOptional()
  @IsDateString()
  to?: string;

  /** Resolve and validate the date range, returning UTC start and end boundaries */
  resolveDateRange(): { startDate: Date; endDate: Date } {
    const now = new Date();

    if (this.preset === 'custom') {
      if (!this.from || !this.to) {
        throw new BadRequestException('from and to are required for custom preset');
      }
      const start = new Date(`${this.from}T00:00:00.000Z`);
      const end = new Date(`${this.to}T23:59:59.999Z`);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Invalid date format');
      }
      if (end < start) {
        throw new BadRequestException('to date must be after from date');
      }
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays >= 30) {
        throw new BadRequestException('Custom range must be less than 30 days');
      }
      return { startDate: start, endDate: end };
    }

    if (this.preset === 'day') {
      const base = this.date ? new Date(`${this.date}T00:00:00.000Z`) : new Date(now.toISOString().slice(0, 10) + 'T00:00:00.000Z');
      const end = new Date(base);
      end.setUTCHours(23, 59, 59, 999);
      return { startDate: base, endDate: end };
    }

    const endDate = new Date(now.toISOString().slice(0, 10) + 'T23:59:59.999Z');
    const startDate = new Date(endDate);

    if (this.preset === '7d') {
      startDate.setUTCDate(startDate.getUTCDate() - 6);
      startDate.setUTCHours(0, 0, 0, 0);
    } else if (this.preset === '15d') {
      startDate.setUTCDate(startDate.getUTCDate() - 14);
      startDate.setUTCHours(0, 0, 0, 0);
    } else if (this.preset === '30d') {
      startDate.setUTCDate(startDate.getUTCDate() - 29);
      startDate.setUTCHours(0, 0, 0, 0);
    } else if (this.preset === '6m') {
      startDate.setUTCMonth(startDate.getUTCMonth() - 6);
      startDate.setUTCHours(0, 0, 0, 0);
    } else if (this.preset === '1y') {
      startDate.setUTCFullYear(startDate.getUTCFullYear() - 1);
      startDate.setUTCHours(0, 0, 0, 0);
    }

    return { startDate, endDate };
  }
}
