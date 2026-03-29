import { io } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const customerSocket = io(`${BASE_URL}/customer`, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

export const supplierSocket = io(`${BASE_URL}/supplier`, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

export const adminSocket = io(`${BASE_URL}/admin`, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

// Helper to update auth token before connection
export const connectSocket = (socket: any) => {
  const token = localStorage.getItem('token');
  if (token) {
    socket.auth = { token };
    socket.connect();
  }
};
