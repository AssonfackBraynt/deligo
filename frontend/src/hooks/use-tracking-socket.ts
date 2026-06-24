import { useEffect } from 'react';
import { createSocket } from '@/lib/socket';

/** Joins the tracking room for a given code and calls onUpdate whenever
 *  the server pushes a `tracking-update` event. Public — no auth needed. */
export function useTrackingSocket(trackingCode: string, onUpdate: () => void) {
  useEffect(() => {
    if (!trackingCode) return;

    const socket = createSocket();

    socket.on('connect', () => {
      socket.emit('join-tracking', trackingCode.toUpperCase());
    });

    // If already connected when the effect runs
    if (socket.connected) {
      socket.emit('join-tracking', trackingCode.toUpperCase());
    }

    socket.on('tracking-update', onUpdate);

    return () => {
      socket.off('tracking-update', onUpdate);
      socket.disconnect();
    };
  }, [trackingCode, onUpdate]);
}
