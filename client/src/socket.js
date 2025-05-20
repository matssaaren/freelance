// src/socket.js
import { io } from 'socket.io-client';

// point this at your Express + Socket.IO server
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,    // we’ll connect manually once we have a token
  auth: {
    token: '8e1090f1d2aa4dbab973fc5f7d96067e0b69fefb58932f9a9d6178b12d7aee32'   // send it on the initial handshake
  }
});

// call this after login (or on app load if token already in storage)
export function connectSocket() {
  if (!socket.connected) socket.connect();
}
