import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { DeliveryRequestController } from './delivery-request.controller';
import { DeliveryRequestService } from './delivery-request.service';
import { TrackingEventsService } from './tracking-events.service';

@Module({
  imports: [NotificationModule],
  controllers: [DeliveryRequestController],
  providers: [DeliveryRequestService, TrackingEventsService],
  exports: [DeliveryRequestService],
})
export class DeliveryRequestModule {}
