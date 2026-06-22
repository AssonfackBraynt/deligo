import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBranchDto {
  @ApiProperty({ description: 'Branch display name (e.g. "Bonanjo Agency")' })
  @IsString()
  @MaxLength(180)
  name: string;

  @ApiProperty({ description: 'Quarter ID where this branch is located' })
  @IsUUID()
  quarterId: string;

  @ApiPropertyOptional({ description: 'Branch direct phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Mark this branch as the headquarters' })
  @IsOptional()
  @IsBoolean()
  isHeadquarters?: boolean;
}
