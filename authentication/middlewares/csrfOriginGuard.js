const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

module.exports = (allowedOrigins) => {
  const allowed = new Set((allowedOrigins || []).filter(Boolean));

  return (req, res, next) => {
    if (!MUTATING_METHODS.has(req.method)) {
      return next();
    }

    const hasAuthCookie = Boolean(req.cookies?.accessToken || req.cookies?.refreshToken);
    if (!hasAuthCookie) {
      return next();
    }

    const origin = req.get('origin');
    if (!origin || !allowed.has(origin)) {
      return res.status(403).json({ message: 'CSRF origin check failed' });
    }

    return next();
  };
};
