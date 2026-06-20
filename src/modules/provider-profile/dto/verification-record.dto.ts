import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum VerificationDocumentType {
  NationalId = 'national_id',
  DriverLicense = 'driver_license',
  BusinessRegistration = 'business_registration',
  TaxDocument = 'tax_document',
  InsuranceDocument = 'insurance_document',
  ProfilePhoto = 'profile',
  VehiclePhoto = 'rider_identity',
  AgencyDocument = 'agency_document',
}

export class CreateVerificationRecordDto {
  @ApiProperty({ enum: VerificationDocumentType })
  @IsEnum(VerificationDocumentType)
  verificationType: VerificationDocumentType;

  @ApiProperty({ description: 'UUID of the uploaded file returned by POST /files/upload' })
  @IsUUID()
  fileId: string;

  @ApiPropertyOptional({ description: 'Optional text value, e.g. national ID number' })
  @IsOptional()
  @IsString()
  submittedValue?: string;
}

export class ReviewVerificationRecordDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsEnum(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approvalNotes?: string;
}
