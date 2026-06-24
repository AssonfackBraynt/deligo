import { useEffect, useRef } from 'react';
import { createSocket } from '@/lib/socket';
import type { MarketplacePost } from '@/features/provider-portal/provider-portal-types';

type Handlers = {
  onNew: (post: MarketplacePost) => void;
  onRemoved: (id: string) => void;
};

/** Joins the marketplace room (provider-authenticated) and calls handlers
 *  when new posts arrive or existing posts are taken. */
export function useMarketplaceSocket(token: string | null, handlers: Handlers) {
  // Keep handlers in a ref so changing them never re-runs the effect
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!token) return;

    const socket = createSocket(token);

    const joinRoom = () => socket.emit('join-marketplace');

    socket.on('connect', joinRoom);
    if (socket.connected) joinRoom();

    socket.on('marketplace-new', (post: MarketplacePost) => {
      handlersRef.current.onNew(post);
    });

    socket.on('marketplace-removed', ({ id }: { id: string }) => {
      handlersRef.current.onRemoved(id);
    });

    return () => {
      socket.off('marketplace-new');
      socket.off('marketplace-removed');
      socket.disconnect();
    };
  }, [token]);
}
