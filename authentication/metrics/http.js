const client = require('prom-client');

const register = new client.Registry();
let defaultMetricsStarted = false;

function startDefaultMetrics() {
  if (defaultMetricsStarted) {
    return;
  }
  client.collectDefaultMetrics({ register });
  defaultMetricsStarted = true;
}

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed.',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds.',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register]
});

function normalizeRoute(req) {
  const routePath = req.route && req.route.path ? req.route.path : '';
  const baseUrl = req.baseUrl || '';
  if (routePath) {
    const route = `${baseUrl}${routePath}`.replace(/\/+/g, '/');
    return route.startsWith('/') ? route : `/${route}`;
  }

  const path = req.path || req.originalUrl || '_unmatched';
  if (/^\/auth\/update\/[^/]+$/.test(path)) return '/auth/update/:id';
  if (/^\/auth\/delete\/[^/]+$/.test(path)) return '/auth/delete/:id';
  return path;
}

function httpMetricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    const route = normalizeRoute(req);
    const status = String(res.statusCode || 0);

    httpRequestsTotal.labels(req.method, route, status).inc();
    httpRequestDurationSeconds.labels(req.method, route, status).observe(durationSeconds);
  });

  next();
}

async function metricsHandler(req, res) {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

startDefaultMetrics();

module.exports = {
  httpMetricsMiddleware,
  metricsHandler
};

