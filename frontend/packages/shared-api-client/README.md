# shared-api-client

Platform-neutral JSON transport for Pokémon Go Nexus clients.

The package has no React, React Native, DOM, storage, or application-state
dependencies. Hosts inject their authentication behavior:

- The web host uses cookie mode and retains HTTP-only cookie sessions.
- The native host uses bearer mode with a session provider backed by secure
  platform storage.
- Public clients use unauthenticated mode.

The package owns request construction, timeout handling, safe response parsing,
typed HTTP failures, and one coordinated access-token refresh. It does not own
screen state, caching, notifications, or persistence.
