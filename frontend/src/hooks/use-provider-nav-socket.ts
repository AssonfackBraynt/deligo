import { useEffect, useRef } from 'react';
import { createSocket } from '@/lib/socket';
import { useProviderBadgeStore } from '@/features/provider-portal/provider-badge-store';
import { routes } from '@/lib/routes';

/**
 * Connects to marketplace + personal-direct WebSocket rooms and increments
 * the provider nav badge counters when new requests arrive.
 * Skips incrementing when the provider is already viewing that section.
 */
export function useProviderNavSocket(
  token: string | null,
  profileId: string | null,
  currentPath: string,
) {
  const incrementMarketplace = useProviderBadgeStore((s) => s.incrementMarketplace);
  const incrementDirect = useProviderBadgeStore((s) => s.incrementDirect);

  const pathRef = useRef(currentPath);
  pathRef.current = currentPath;

  const profileIdRef = useRef(profileId);
  profileIdRef.current = profileId;

  useEffect(() => {
    if (!token) return;

    const socket = createSocket(token);

    const join = () => {
      socket.emit('join-marketplace');
      if (profileIdRef.current) {
        socket.emit('join-provider-direct', profileIdRef.current);
      }
    };

    socket.on('connect', join);
    if (socket.connected) join();

    socket.on('marketplace-new', () => {
      if (pathRef.current !== routes.provider.marketplace) {
        incrementMarketplace();
      }
    });

    socket.on('direct-request-new', () => {
      if (pathRef.current !== routes.provider.myRequests) {
        incrementDirect();
      }
    });

    return () => {
      socket.off('marketplace-new');
      socket.off('direct-request-new');
      socket.disconnect();
    };
  }, [token, incrementMarketplace, incrementDirect]);
}
