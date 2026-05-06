# Shared Assets

This folder is the canonical source for shared web/mobile media while the app uses the frontend nginx image as its static asset host.

Structure:

- `assets/images` - Pokemon and app image content (including type icons, sprites, and branding images).
- `assets/icons` - App icon sizes.
- `assets/media` - Shared media files (loading spinners).
- `assets/favicons` - Browser favicon assets.

Do not duplicate shared media under frontend package `public/` folders. The web app should request these files through the same `/media/...` paths that production serves.

Long-term target:

- Serve these assets from a dedicated static host/CDN.
- Have backend APIs return absolute asset URLs for all clients.

Current production serving path (frontend nginx):

- `https://pokemongonexus.com/media/images/...`
- `https://pokemongonexus.com/media/icons/...`
- `https://pokemongonexus.com/media/media/...`
- `https://pokemongonexus.com/media/favicons/...`

Loading spinner sources:

- `/media/media/loading_spinner.webm`
- `/media/media/loading_spinner_light.webm`

Deploy flow (current CI/CD):

1. Commit and push changes under `assets/**`, `nginx/**`, or `frontend/**`.
2. `ci-frontend` rebuilds the frontend nginx image and now stages `assets/**` into the image.
3. Run `deploy-frontend-prod` workflow to roll out `frontend_nginx`.
4. Verify from prod:
   - `curl -I https://pokemongonexus.com/media/images/alola_search.png`
   - Expect `200` with `Cache-Control: public, max-age=31536000, immutable`.

Cloudflare cache setup:

- Keep Cloudflare proxy enabled for `pokemongonexus.com` (orange cloud).
- Add a Cache Rule for URL path starts with `/media/`:
  - Cache eligibility: `Eligible for cache`.
  - Edge TTL: e.g. `1 month` or `1 year`.
  - Browser TTL: respect origin (or set explicit TTL).

This gives CDN-backed assets now without paid object storage.
