import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import { Observable } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';

@Injectable()
export class TrackingEventsService {
  private readonly emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(0); // unlimited concurrent SSE connections
  }

  /** Called by the delivery service when a tracking-relevant mutation happens. */
  emit(trackingCode: string): void {
    this.emitter.emit(`tracking:${trackingCode}`);
  }

  /** Returns an Observable that delivers one SSE frame per status change. */
  createStream(trackingCode: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const code = trackingCode.toUpperCase();

      const handler = () => {
        subscriber.next({ data: { event: 'update', code } });
      };

      // 30-second keepalive so the browser doesn't time out the SSE connection
      const keepAlive = setInterval(() => {
        try {
          subscriber.next({ data: { event: 'ping' } });
        } catch {
          // subscriber already closed
        }
      }, 30_000);

      this.emitter.on(`tracking:${code}`, handler);

      // Cleanup when the browser disconnects
      return () => {
        this.emitter.off(`tracking:${code}`, handler);
        clearInterval(keepAlive);
      };
    });
  }
}
