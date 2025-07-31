// app.js

// Load environment variables
const dotenv = require('dotenv');
const envFile = process.env.NODE_ENV === '.env';
dotenv.config({ path: envFile });

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passportSetup = require('./strategies/passport-setup');
const passport = require('passport');
const session = require('express-session');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const fs = require('fs');
const path = require('path');
const logger = require('./middlewares/logger');
const cron = require('node-cron');
const createBackup = require('./tasks/backup');

const appConfigPath = path.join(__dirname, 'config', 'app_conf.yml');
const appConfigContent = fs.readFileSync(appConfigPath, 'utf8');
const appConfig = YAML.parse(appConfigContent);

const openAPIPath = path.join(__dirname, 'config', 'openapi.yml');
const openAPIContent = fs.readFileSync(openAPIPath, 'utf8');
const swaggerDocument = YAML.parse(openAPIContent);

const app = express();

// ─────────────────────────────────────────────────────────────
// Schedule daily DB backup
// ─────────────────────────────────────────────────────────────
cron.schedule('0 0 * * *', () => {
  console.log('Running daily database backup...');
  createBackup();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const MongoStore = require('connect-mongo');

// ─────────── Session cookie (now always SameSite=None; Secure) ───────────
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.DATABASE_URL,
      ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: {
      secure: true,      // trust nginx TLS
      httpOnly: true,
      sameSite: 'None'   // allow localhost frontend to send cookie
    }
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// JSON, cookies, proxy
app.use(express.json());
app.use(cookieParser());
app.set('trust proxy', 'loopback, linklocal, uniquelocal');

// ─────────── CORS (added localhost:5173) ───────────
const allowedOrigins = [
  'http://localhost:3000',
  'https://pokemongonexus.com',
  'https://www.pokemongonexus.com'
];

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

// Security headers
app.use(helmet());

// Custom logger
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// MongoDB
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => logger.info('Connected to Database'))
  .catch(error => logger.error('Connection error:', error));

// Rate limit auth routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/auth', limiter);

// Routes
app.use('/auth', require('./routes/authRoute'));
app.use('/auth', require('./routes/tradeRevealRoute'));

// Port
const port = appConfig.app.port || 3002;
app.listen(port, () => logger.info(`Auth-service listening on ${port}`));

// Central error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled Error:', err);
  const status = err.status || 500;
  res.status(status).send({ message: status === 500 ? 'Internal Server Error' : err.message });
});
