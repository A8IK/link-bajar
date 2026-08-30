const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { redis } = require('../config/redis');
const { verifyAccess } = require('../utils/jwt');
const config = require('../config');
const logger = require('../utils/logger');

let io;

const initSockets = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: config.corsOrigin, credentials: true },
    transports: ['websocket', 'polling'],
  });

  // Redis adapter — only enable when @socket.io/redis-adapter is installed
  try {
    const pub = redis.duplicate();
    const sub = redis.duplicate();
    io.adapter(createAdapter(pub, sub));
  } catch (err) {
    logger.warn('Redis adapter not installed for socket.io — single-node mode');
  }

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Missing token'));
      const decoded = verifyAccess(token);
      socket.userId = decoded.sub;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    if (socket.userRole === 'admin') socket.join('role:admin');

    socket.on('order:join', (orderId) => socket.join(`order:${orderId}`));
    socket.on('order:leave', (orderId) => socket.leave(`order:${orderId}`));

    socket.on('order:message', (payload) => {
      // Persistence handled by REST endpoint; broadcast here
      io.to(`order:${payload.orderId}`).emit('order:message', payload);
    });

    socket.on('disconnect', () => {});
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSockets, getIO };
