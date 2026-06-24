import { io, type Socket } from 'socket.io-client';

const SOCKET_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1').replace(
    /\/api\/v\d+\/?$/,
    '',
  );

/** Create a fresh Socket.IO connection. Pass the JWT access token for
 *  authenticated rooms (marketplace, admin). Caller is responsible for
 *  calling socket.disconnect() on cleanup. */
export function createSocket(token?: string | null): Socket {
  return io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    auth: token ? { token } : {},
    autoConnect: true,
  });
}
