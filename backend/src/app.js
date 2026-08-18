const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const routes = require('./routes');
const openApiSpec = require('./docs/openapi');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*' ? process.env.CORS_ORIGIN.split(',') : true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Generous but present rate limiting on the whole API - protects against runaway integrations.
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('/api/docs.json', (req, res) => res.json(openApiSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customSiteTitle: 'CMMS API Docs',
}));

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
