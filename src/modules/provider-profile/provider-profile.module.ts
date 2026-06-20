import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { ProviderProfileController } from './provider-profile.controller';
import { ProviderProfileService } from './provider-profile.service';

@Module({
  imports: [NotificationModule],
  controllers: [ProviderProfileController],
  providers: [ProviderProfileService],
  exports: [ProviderProfileService],
})
export class ProviderProfileModule {}
