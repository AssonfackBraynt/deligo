import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiPropertyOptional({ description: 'Purpose of the file (national_id, profile_photo, etc.)' })
  @IsOptional()
  @IsString()
  documentPurpose?: string;
}

export class UploadedFileResponseDto {
  id: string;
  originalFilename: string | null;
  mimeType: string | null;
  fileSizeBytes: string | null;
  documentPurpose: string | null;
  createdAt: Date;
}
