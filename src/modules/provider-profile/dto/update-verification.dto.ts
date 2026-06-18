import { ApiProperty } from '@nestjs/swagger';
import { VerificationStatus } from '@prisma/client';
import { IsIn } from 'class-validator';

export class UpdateVerificationDto {
  @ApiProperty({
    enum: [
      VerificationStatus.pending,
      VerificationStatus.verified,
      VerificationStatus.rejected,
      VerificationStatus.suspended,
    ],
    description: 'Admin-settable values only. "unverified" is the initial default and cannot be set by admin.',
  })
  @IsIn([
    VerificationStatus.pending,
    VerificationStatus.verified,
    VerificationStatus.rejected,
    VerificationStatus.suspended,
  ])
  verificationStatus: VerificationStatus;
}
