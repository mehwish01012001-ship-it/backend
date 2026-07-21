const { Server } = require('socket.io');

exports.initSockets = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL, process.env.ADMIN_PANEL_URL, process.env.ADMIN_URL].filter(Boolean),
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('joinRoom', (room) => socket.join(room));
    socket.on('leaveRoom', (room) => socket.leave(room));
    socket.on('disconnect', () => {});
  });

  return io;
};
