import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';

export type NotificationEvent =
  | 'NEW_REQUEST'
  | 'DIRECT_REQUEST'
  | 'NEW_BID'
  | 'BID_ACCEPTED'
  | 'PROVIDER_ASSIGNED'
  | 'PARCEL_COLLECTED'
  | 'IN_TRANSIT'
  | 'DELIVERY_COMPLETED'
  | 'VERIFICATION_SUBMITTED'
  | 'PROVIDER_VERIFIED'
  | 'PROVIDER_REJECTED';

export interface NotificationPayload {
  event: NotificationEvent;
  trackingCode?: string;
  deliveryRequestId?: string;
  deliveryType?: string;
  customerName?: string;
  customerWhatsapp?: string;
  providerName?: string;
  pickup?: string;
  destination?: string;
  amount?: number;
  notes?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly csNumber: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.csNumber = config.get<string>('CS_WHATSAPP_NUMBER', '+237694374748');
  }

  async notifyCustomerService(payload: NotificationPayload): Promise<void> {
    const message = this.buildMessage(payload);

    this.logger.log(
      `[WHATSAPP → ${this.csNumber}]\n${message}`,
    );

    try {
      await this.prisma.notification.create({
        data: {
          channel: 'whatsapp',
          notificationType: payload.event,
          destination: this.csNumber,
          message,
          deliveryRequestId: payload.deliveryRequestId ?? null,
          status: 'pending',
          metadata: payload as any,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to persist notification record: ${err}`);
    }
  }

  private buildMessage(p: NotificationPayload): string {
    const header = `🚚 DeliGo — ${p.event}`;
    const lines: string[] = [header];
    if (p.trackingCode) lines.push(`Tracking: ${p.trackingCode}`);
    if (p.deliveryType) lines.push(`Type: ${p.deliveryType}`);
    if (p.pickup && p.destination) lines.push(`Route: ${p.pickup} → ${p.destination}`);
    if (p.customerName) lines.push(`Customer: ${p.customerName}${p.customerWhatsapp ? ` / ${p.customerWhatsapp}` : ''}`);
    if (p.providerName) lines.push(`Provider: ${p.providerName}`);
    if (p.amount) lines.push(`Amount: ${p.amount.toLocaleString()} FCFA`);
    if (p.notes) lines.push(`Notes: ${p.notes}`);
    lines.push(`Time: ${new Date().toISOString()}`);
    return lines.join('\n');
  }
}
