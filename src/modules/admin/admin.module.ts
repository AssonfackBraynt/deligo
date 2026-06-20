import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { BootstrapController } from './bootstrap.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController, BootstrapController],
  providers: [AdminService],
})
export class AdminModule {}
