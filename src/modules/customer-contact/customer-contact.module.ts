import { Module } from '@nestjs/common';
import { CustomerContactController } from './customer-contact.controller';
import { CustomerContactService } from './customer-contact.service';

@Module({
  controllers: [CustomerContactController],
  providers: [CustomerContactService],
  exports: [CustomerContactService],
})
export class CustomerContactModule {}
