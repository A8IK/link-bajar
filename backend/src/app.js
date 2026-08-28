const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const config = require('./config');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { baseLimiter } = require('./middleware/rateLimiter');

const app = express();

app.set('trust proxy', 1); // we sit behind nginx
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));

app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.get('/readyz', (req, res) => res.json({ ready: true }));

app.use(config.apiPrefix, baseLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
