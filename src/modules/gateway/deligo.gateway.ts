import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';

@Injectable()
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
})
export class DeliGoGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // Decode JWT on connect and cache roles on client.data
  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (token) {
        const payload = this.jwt.verify<{ roles?: string[] }>(token, {
          secret: this.config.getOrThrow<string>('auth.accessSecret'),
        });
        client.data.roles = payload.roles ?? [];
      } else {
        client.data.roles = [];
      }
    } catch {
      client.data.roles = [];
    }
  }

  // ── Rooms ──────────────────────────────────────────────────────────────────

  /** Public — anyone can track a delivery. */
  @SubscribeMessage('join-tracking')
  handleJoinTracking(
    @ConnectedSocket() client: Socket,
    @MessageBody() code: string,
  ) {
    const room = `tracking:${String(code).toUpperCase()}`;
    void client.join(room);
    client.emit('joined', { room });
  }

  /** Providers only — live marketplace feed. */
  @SubscribeMessage('join-marketplace')
  handleJoinMarketplace(@ConnectedSocket() client: Socket) {
    if (!(client.data.roles as string[])?.includes('provider')) {
      client.emit('ws-error', { message: 'Unauthorized' });
      return;
    }
    void client.join('marketplace');
    client.emit('joined', { room: 'marketplace' });
  }

  /** Admins only — live dashboard stats. */
  @SubscribeMessage('join-admin')
  handleJoinAdmin(@ConnectedSocket() client: Socket) {
    if (!(client.data.roles as string[])?.includes('admin')) {
      client.emit('ws-error', { message: 'Unauthorized' });
      return;
    }
    void client.join('admin');
    client.emit('joined', { room: 'admin' });
  }

  /** Provider only — personal room for direct-request notifications. */
  @SubscribeMessage('join-provider-direct')
  handleJoinProviderDirect(
    @ConnectedSocket() client: Socket,
    @MessageBody() profileId: string,
  ) {
    if (!(client.data.roles as string[])?.includes('provider')) {
      client.emit('ws-error', { message: 'Unauthorized' });
      return;
    }
    void client.join(`provider-direct:${profileId}`);
    client.emit('joined', { room: `provider-direct:${profileId}` });
  }

  // ── Emit helpers called by services ───────────────────────────────────────

  /** Tracking page: delivery status changed — client refetches via REST. */
  emitTrackingUpdate(trackingCode: string) {
    this.server
      .to(`tracking:${trackingCode.toUpperCase()}`)
      .emit('tracking-update', { code: trackingCode.toUpperCase() });
  }

  /** Marketplace: a new open request just appeared. */
  emitMarketplaceNew(post: unknown) {
    this.server.to('marketplace').emit('marketplace-new', post);
  }

  /** Marketplace: a request was taken / assigned — remove it from the feed. */
  emitMarketplaceRemoved(requestId: string) {
    this.server.to('marketplace').emit('marketplace-removed', { id: requestId });
  }

  /** Admin dashboard: something changed — client refetches stats via REST. */
  emitAdminStatsChanged() {
    this.server.to('admin').emit('admin-stats-changed', {});
  }

  /** Direct request: notify the target provider's personal room. */
  emitDirectRequestNew(providerProfileId: string) {
    this.server.to(`provider-direct:${providerProfileId}`).emit('direct-request-new', {});
  }
}
