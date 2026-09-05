import { io } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

let socket = null;

export const getSocket = () => {
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;
  if (socket?.connected) return socket;
  if (socket) socket.disconnect();
  socket = io(import.meta.env.VITE_API_URL || window.location.origin, {
    auth: { token },
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
