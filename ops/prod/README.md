# Production Deploy State

GitHub workflows use fresh checkouts for deployment definitions. Durable state
lives outside the checkout under `/srv/pokegonexus` and in named Docker
volumes.

Host-local state includes:

- private service environment files
- service backups and logs
- certbot hooks
- monitoring and queue state

Database data belongs to its service-owned Docker volume. The Pokemon catalog
uses `pokemon_catalog_pgdata`; deployments preserve that volume and apply
versioned migrations before starting the API.

The old checkout-to-runtime state migration is retired. New hosts should be
provisioned using each service's current Compose file and runbook, then restore
private database backups where required.
