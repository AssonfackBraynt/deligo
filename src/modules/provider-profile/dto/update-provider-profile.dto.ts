import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateProviderProfileDto } from './create-provider-profile.dto';

export class UpdateProviderProfileDto extends PartialType(
  OmitType(CreateProviderProfileDto, ['providerType'] as const),
) {}
