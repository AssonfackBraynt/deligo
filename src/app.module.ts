import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { validateEnv } from './config/env.schema';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import paymentConfig from './config/payment.config';
import notificationConfig from './config/notification.config';
import { DatabaseModule } from './database/database.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { IntelligenceModule } from './modules/intelligence/intelligence.module';
import { CustomerContactModule } from './modules/customer-contact/customer-contact.module';
import { DeliveryRequestModule } from './modules/delivery-request/delivery-request.module';
import { LocationModule } from './modules/location/location.module';
import { ProviderProfileModule } from './modules/provider-profile/provider-profile.module';
import { UsersModule } from './modules/users/users.module';
import { UploadModule } from './modules/upload/upload.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      load: [appConfig, authConfig, databaseConfig, paymentConfig, notificationConfig],
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    CustomerContactModule,
    DeliveryRequestModule,
    LocationModule,
    ProviderProfileModule,
    IntelligenceModule,
    UploadModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
