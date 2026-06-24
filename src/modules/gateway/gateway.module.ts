import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DeliGoGateway } from './deligo.gateway';

@Module({
  imports: [
    // secrets are read from ConfigService at runtime inside the gateway
    JwtModule.register({}),
  ],
  providers: [DeliGoGateway],
  exports: [DeliGoGateway],
})
export class GatewayModule {}
