// server.js
const express = require('express');
const cors = require('cors');
const logger = require('./middlewares/logger');
const pokemonRoutes = require('./routes/pokemonRoutes');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://pokemongonexus.com',
  'https://www.pokemongonexus.com',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      (typeof origin === 'string' && origin.endsWith('.cloudflare.com'));

    if (isAllowed) return callback(null, true);

    logger.warn(`Unauthorized CORS access attempt from origin: ${origin}`);
    return callback(new Error('CORS not allowed for this origin'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

app.use(cors(corsOptions));

app.use((err, req, res, next) => {
  if (err && err.message === 'CORS not allowed for this origin') {
    return res.status(403).json({ error: 'CORS forbidden' });
  }
  next(err);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('trust proxy', true);

app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.path} from ${req.ip}`);
  next();
});

app.use(pokemonRoutes);

const port = process.env.PORT || 3001;

app.listen(port, "0.0.0.0", () => {
  logger.info(`Server is running on http://0.0.0.0:${port} and accessible on the network`);

  // Prewarm cache (non-blocking)
  const shouldPrewarm = process.env.CACHE_PREWARM !== '0';
  const cache = pokemonRoutes.pokemonPayloadCache;

  if (shouldPrewarm && cache && typeof cache.ensureBuilt === 'function') {
    logger.info('Prewarming /pokemon/pokemons cache at startup...');
    cache.ensureBuilt()
      .then(() => logger.info('Prewarm complete'))
      .catch((err) => logger.error(`Prewarm failed: ${err?.message || err}`));
  }
});
