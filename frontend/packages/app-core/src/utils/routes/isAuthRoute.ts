const AUTH_ROUTES = new Set(['/login', '/register']);

function normalizePath(pathname: string): string {
  const lowered = pathname.toLowerCase();
  if (lowered.length > 1 && lowered.endsWith('/')) {
    return lowered.slice(0, -1);
  }
  return lowered;
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.has(normalizePath(pathname));
}
