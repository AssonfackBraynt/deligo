import { Module } from '@nestjs/common';
import { GatewayModule } from '../gateway/gateway.module';
import { AdminController } from './admin.controller';
import { BootstrapController } from './bootstrap.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [GatewayModule],
  controllers: [AdminController, BootstrapController],
  providers: [AdminService],
})
export class AdminModule {}
