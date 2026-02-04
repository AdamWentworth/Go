// utils/responseCache.js
// Generic-ish cache for one big JSON payload (string + gzip + etag) with timing logs.

const crypto = require('crypto');
const zlib = require('zlib');
const logger = require('../middlewares/logger');

function nowMs() {
  return Number(process.hrtime.bigint() / 1000000n);
}

function computeStrongEtag(bodyString) {
  const hash = crypto.createHash('sha256').update(bodyString).digest('base64');
  return `"${hash}"`;
}

function clientAcceptsGzip(req) {
  const ae = req.headers['accept-encoding'];
  return typeof ae === 'string' && ae.toLowerCase().includes('gzip');
}

function createJsonGzipCache({ name, buildPayload }) {
  let cachedJson = null;        // string
  let cachedGzip = null;        // Buffer
  let cachedEtag = null;        // string (quoted)
  let cachedBuiltAtMs = 0;      // epoch ms
  let buildingPromise = null;   // Promise<void> | null
  let lastBuildStats = null;

  async function ensureBuilt() {
    if (cachedJson && cachedEtag && cachedGzip) return;

    if (!buildingPromise) {
      buildingPromise = (async () => {
        const tStart = nowMs();

        const tBuild0 = nowMs();
        const payloadObj = await buildPayload();
        const buildMs = nowMs() - tBuild0;

        const tStr0 = nowMs();
        const body = JSON.stringify(payloadObj);
        const stringifyMs = nowMs() - tStr0;

        const tGz0 = nowMs();
        const etag = computeStrongEtag(body);
        const gz = zlib.gzipSync(Buffer.from(body, 'utf8'), { level: 6 });
        const gzipMs = nowMs() - tGz0;

        cachedJson = body;
        cachedEtag = etag;
        cachedGzip = gz;
        cachedBuiltAtMs = Date.now();

        const totalMs = nowMs() - tStart;

        lastBuildStats = {
          name,
          totalMs,
          buildMs,
          stringifyMs,
          gzipMs,
          count: Array.isArray(payloadObj) ? payloadObj.length : null,
          jsonBytes: Buffer.byteLength(body, 'utf8'),
          gzBytes: gz.length,
          builtAtMs: cachedBuiltAtMs
        };

        logger.info(
          `Cache build complete (${name}): total=${totalMs}ms ` +
          `(db+compose=${buildMs}ms, stringify=${stringifyMs}ms, gzip+etag=${gzipMs}ms), ` +
          `count=${lastBuildStats.count}, json=${lastBuildStats.jsonBytes}B, gz=${lastBuildStats.gzBytes}B`
        );
      })().finally(() => {
        buildingPromise = null;
      });
    }

    await buildingPromise;
  }

  function invalidate() {
    cachedJson = null;
    cachedGzip = null;
    cachedEtag = null;
    cachedBuiltAtMs = 0;
    lastBuildStats = null;
  }

  function send(req, res) {
    const t0 = nowMs();

    // Conditional GET (ETag)
    const ifNoneMatch = req.headers['if-none-match'];
    if (cachedEtag && typeof ifNoneMatch === 'string' && ifNoneMatch === cachedEtag) {
      res.setHeader('ETag', cachedEtag);
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      res.setHeader('Last-Modified', new Date(cachedBuiltAtMs || Date.now()).toUTCString());
      res.setHeader('Vary', 'Origin, Accept-Encoding');

      res.status(304).end();
      return { status: 304, bytes: 0, encoding: 'none', sendMs: nowMs() - t0 };
    }

    res.setHeader('ETag', cachedEtag || '');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('Last-Modified', new Date(cachedBuiltAtMs || Date.now()).toUTCString());
    res.setHeader('Vary', 'Origin, Accept-Encoding');

    if (clientAcceptsGzip(req) && cachedGzip) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Encoding', 'gzip');
      res.status(200).send(cachedGzip);
      return { status: 200, bytes: cachedGzip.length, encoding: 'gzip', sendMs: nowMs() - t0 };
    }

    const body = cachedJson || '[]';
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(body);
    return { status: 200, bytes: Buffer.byteLength(body, 'utf8'), encoding: 'identity', sendMs: nowMs() - t0 };
  }

  function stats() {
    return {
      name,
      hasCache: Boolean(cachedJson && cachedEtag && cachedGzip),
      etag: cachedEtag,
      builtAt: cachedBuiltAtMs ? new Date(cachedBuiltAtMs).toISOString() : null,
      lastBuildStats
    };
  }

  return { ensureBuilt, invalidate, send, stats };
}

module.exports = { createJsonGzipCache };
