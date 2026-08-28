const http = require('http');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { connectDB, sequelize } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initSockets } = require('./sockets');

const start = async () => {
  try {
    await connectDB();
    await connectRedis();

    if (config.env === 'development') {
      await sequelize.sync({ alter: false });
    }

    const server = http.createServer(app);
    initSockets(server);

    server.listen(config.port, () => {
      logger.info(`API listening on :${config.port} [${config.env}]`);
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error(`Failed to start: ${err.message}`);
    process.exit(1);
  }
};

start();
