const { Sequelize } = require('sequelize');
const config = require('./index');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    pool: config.db.pool,
    logging: config.env === 'development' ? (msg) => logger.debug(msg) : false,
    define: {
      timestamps: true,
      underscored: false,
    },
  },
);

const connectDB = async () => {
  await sequelize.authenticate();
  logger.info('Postgres connected');
};

module.exports = { sequelize, connectDB };
