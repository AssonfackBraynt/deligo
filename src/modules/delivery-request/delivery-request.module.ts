import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { GatewayModule } from '../gateway/gateway.module';
import { DeliveryRequestController } from './delivery-request.controller';
import { DeliveryRequestService } from './delivery-request.service';
import { TrackingEventsService } from './tracking-events.service';

@Module({
  imports: [NotificationModule, GatewayModule],
  controllers: [DeliveryRequestController],
  providers: [DeliveryRequestService, TrackingEventsService],
  exports: [DeliveryRequestService],
})
export class DeliveryRequestModule {}
