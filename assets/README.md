# Shared Assets

This folder is the canonical source for shared web/mobile media while the app uses the frontend nginx image as its static asset host.

Structure:

- `assets/images` - Pokemon and app image content (including type icons, sprites, and branding images).
- `assets/icons` - App icon sizes.
- `assets/media` - Shared media files (loading spinners).
- `assets/favicons` - Browser favicon assets.

## PokeGo Nexus brand assets

The canonical application branding lives in `assets/images/logo`:

- `source-mark.png` - full-resolution transparent source mark; do not serve this large file directly in ordinary UI.
- `logo.png` - optimized transparent mark used by the web application.
- `wordmark.png` - transparent standalone wordmark.
- `lockup.png` - transparent horizontal mark-and-wordmark lockup.
- `email-lockup.png` - compact lockup for transactional email templates.
- `social-card.png` - 1200×630 Open Graph/Twitter sharing image.

Installable-app exports live in both `assets/icons` and the web package's `public/icons` directory. `icon-*` files retain transparency; `maskable-icon-*` files include the approved navy safe area required by adaptive launchers. Native Expo icons are derived from the same mark under `frontend/apps/mobile/assets`.

Use **PokeGo Nexus** for user-facing product text. The unspaced **PokeGoNexus** form is reserved for legacy identifiers, account handles, and places where changing the identifier would break compatibility.

Do not duplicate shared media under frontend package `public/` folders. The web app should request these files through the same `/media/...` paths that production serves.

Long-term target:

- Serve these assets from a dedicated static host/CDN.
- Have backend APIs return absolute asset URLs for all clients.

Current production serving path (frontend nginx):

- `https://pokegonexus.com/media/images/...`
- `https://pokegonexus.com/media/icons/...`
- `https://pokegonexus.com/media/media/...`
- `https://pokegonexus.com/media/favicons/...`

Loading spinner sources:

- `/media/media/loading_spinner.webm`
- `/media/media/loading_spinner_light.webm`

Deploy flow (current CI/CD):

1. Commit and push changes under `assets/**`, `nginx/**`, or `frontend/**`.
2. `ci-frontend` rebuilds the frontend nginx image and now stages `assets/**` into the image.
3. Run `deploy-frontend-prod` workflow to roll out `frontend_nginx`.
4. Verify from prod:
   - `curl -I https://pokegonexus.com/media/images/alola_search.png`
   - Expect `200` with `Cache-Control: public, max-age=31536000, immutable`.

Optional CDN cache setup:

- Put a CDN in front of `pokegonexus.com` when you are ready for edge caching.
- Add a cache rule for URL path starts with `/media/`:
  - Cache eligibility: `Eligible for cache`.
  - Edge TTL: e.g. `1 month` or `1 year`.
  - Browser TTL: respect origin (or set explicit TTL).

This gives CDN-backed assets later without moving media into object storage.
