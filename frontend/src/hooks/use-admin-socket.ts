import { useEffect, useRef } from 'react';
import { createSocket } from '@/lib/socket';

/** Joins the admin room (admin-authenticated) and calls onStatsChanged
 *  whenever the server signals that dashboard stats have been updated. */
export function useAdminSocket(token: string | null, onStatsChanged: () => void) {
  const callbackRef = useRef(onStatsChanged);
  callbackRef.current = onStatsChanged;

  useEffect(() => {
    if (!token) return;

    const socket = createSocket(token);

    const joinRoom = () => socket.emit('join-admin');

    socket.on('connect', joinRoom);
    if (socket.connected) joinRoom();

    socket.on('admin-stats-changed', () => {
      callbackRef.current();
    });

    return () => {
      socket.off('admin-stats-changed');
      socket.disconnect();
    };
  }, [token]);
}
