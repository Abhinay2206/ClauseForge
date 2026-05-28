const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    // Authenticate socket connection
    const token = socket.handshake.auth.token || _extractCookie(socket.handshake.headers.cookie, 'jwt');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        socket.user = { id: decoded.id };
        return next();
      } catch (err) {
        // We still allow connection for public chat (if implemented) but mark as unauthenticated
        socket.user = null;
        return next();
      }
    }
    socket.user = null;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`New socket connection: ${socket.id} (User: ${socket.user?.id || 'Public'})`);

    // Join a specific ticket room
    socket.on('join_ticket', (ticketId) => {
      socket.join(`ticket_${ticketId}`);
      console.log(`Socket ${socket.id} joined room ticket_${ticketId}`);
    });

    // Leave a specific ticket room
    socket.on('leave_ticket', (ticketId) => {
      socket.leave(`ticket_${ticketId}`);
      console.log(`Socket ${socket.id} left room ticket_${ticketId}`);
    });

    // Handle typing indicators
    socket.on('typing', ({ ticketId, isTyping, userName }) => {
      socket.to(`ticket_${ticketId}`).emit('user_typing', {
        userId: socket.user?.id || 'public',
        userName: userName || 'Someone',
        isTyping
      });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

const emitToTicket = (ticketId, event, data) => {
  if (io) {
    io.to(`ticket_${ticketId}`).emit(event, data);
  }
};

// Helper to extract cookie from string
function _extractCookie(cookieString, name) {
  if (!cookieString) return null;
  const match = cookieString.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
}

module.exports = {
  initSocket,
  getIO,
  emitToTicket
};
