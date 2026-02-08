// app.js

const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const logger = require('./middlewares/logger');
const cron = require('node-cron');
const createBackup = require('./tasks/backup');
const isTest = process.env.NODE_ENV === 'test';

const appConfigPath = path.join(__dirname, 'config', 'app_conf.yml');
const appConfigContent = fs.readFileSync(appConfigPath, 'utf8');
const appConfig = yaml.load(appConfigContent) || {};

const openAPIPath = path.join(__dirname, 'config', 'openapi.yml');
const openAPIContent = fs.readFileSync(openAPIPath, 'utf8');
const swaggerDocument = yaml.load(openAPIContent);

const app = express();

// Schedule daily DB backup.
if (!isTest) {
  cron.schedule('0 0 * * *', () => {
    logger.info('Running daily database backup...');
    createBackup();
  });
}

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// JSON, cookies, proxy.
app.use(express.json());
app.use(cookieParser());
app.set('trust proxy', 'loopback, linklocal, uniquelocal');

const configuredFrontendOrigin = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [];
const allowedOrigins = Array.from(
  new Set([
    ...configuredFrontendOrigin,
    'http://localhost:3000',
    'https://pokemongonexus.com',
    'https://www.pokemongonexus.com'
  ])
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed for this origin'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200
  })
);

app.use(helmet());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

const mongoConnectionPromise = mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => logger.info('Connected to Database'))
  .catch(error => {
    logger.error(`Connection error: ${error.message}`);
    throw error;
  });

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/auth', limiter);

app.use('/auth', require('./routes/authRoute'));
app.use('/auth', require('./routes/tradeRevealRoute'));

function startServer() {
  const port = appConfig.app?.port || 3002;
  return app.listen(port, () => logger.info(`Auth-service listening on ${port}`));
}

if (require.main === module) {
  startServer();
}

app.use((err, req, res, next) => {
  logger.error(`Unhandled Error: ${err.message || err}`);
  const status = err.status || 500;
  res.status(status).send({ message: status === 500 ? 'Internal Server Error' : err.message });
});

module.exports = {
  app,
  startServer,
  mongoConnectionPromise
};
