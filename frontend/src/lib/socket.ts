import { io, type Socket } from 'socket.io-client';

const SOCKET_PORT = 4000;

function getSocketUrl(): string {
  if (typeof window === 'undefined') return `http://localhost:${SOCKET_PORT}`;
  return `http://${window.location.hostname}:${SOCKET_PORT}`;
}

/** Create a fresh Socket.IO connection. Pass the JWT access token for
 *  authenticated rooms (marketplace, admin). Caller is responsible for
 *  calling socket.disconnect() on cleanup. */
export function createSocket(token?: string | null): Socket {
  return io(getSocketUrl(), {
    transports: ['websocket', 'polling'],
    auth: token ? { token } : {},
    autoConnect: true,
  });
}
