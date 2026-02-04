// routes/pokemonRoutes.js
// Thin route layer: delegates to cache + builder.

const express = require('express');
const router = express.Router();

const logger = require('../middlewares/logger');
const { buildFullPokemonPayload } = require('../services/pokemonPayloadBuilder');
const { createJsonGzipCache } = require('../utils/responseCache');

function nowMs() {
  return Number(process.hrtime.bigint() / 1000000n);
}

// Cache instance for /pokemon/pokemons
const pokemonPayloadCache = createJsonGzipCache({
  name: '/pokemon/pokemons',
  buildPayload: buildFullPokemonPayload
});

router.get('/pokemon/pokemons', async (req, res) => {
  const reqStart = nowMs();
  const hadCache = pokemonPayloadCache.stats().hasCache;

  try {
    await pokemonPayloadCache.ensureBuilt();
    const wasMiss = !hadCache;

    const sendInfo = pokemonPayloadCache.send(req, res);
    const totalMs = nowMs() - reqStart;

    logger.info(
      `Response /pokemon/pokemons: status=${sendInfo.status} totalMs=${totalMs}ms`
    );
  } catch (err) {
    const totalMs = nowMs() - reqStart;
    logger.error(`Error serving /pokemon/pokemons after ${totalMs}ms: ${err?.message || err}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Optional: cache stats
router.get('/internal/cache/stats', (req, res) => {
  res.json(pokemonPayloadCache.stats());
});

// Optional: manual invalidation (token-protected if CACHE_REFRESH_TOKEN set)
router.post('/internal/cache/refresh', (req, res) => {
  const token = process.env.CACHE_REFRESH_TOKEN;
  if (token) {
    const provided = req.headers['x-cache-refresh-token'];
    if (typeof provided !== 'string' || provided !== token) {
      return res.sendStatus(403);
    }
  }

  pokemonPayloadCache.invalidate();
  logger.info('Cache invalidated via /internal/cache/refresh');
  return res.sendStatus(204);
});

// Export cache handles so server.js can prewarm on startup.
router.pokemonPayloadCache = pokemonPayloadCache;

module.exports = router;
