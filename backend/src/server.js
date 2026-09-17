const http = require('http');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { connectDB, sequelize } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initSockets } = require('./sockets');
const { seedAdmins } = require('../scripts/create-admins');

const start = async () => {
  try {
    await connectDB();
    await connectRedis();

    if (config.env === 'development' || process.env.DB_SYNC === 'true') {
      await sequelize.sync({ alter: false });
      logger.info('Sequelize sync completed');
    }

    if (process.env.SEED_ADMINS === 'true') {
      await seedAdmins(logger);
      logger.info('Admin seeding completed');
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
