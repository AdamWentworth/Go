# Frontend Style Architecture

This folder contains shared styling primitives used across the app.

## Structure

1. `tokens.css`
   - Global design tokens only.
   - Allowed: CSS custom properties (`--color-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--motion-*`, `--z-*`).
   - Not allowed: component selectors.

2. Feature-level CSS
   - Keep feature selectors inside their feature directories (for example `src/pages/Search/**`).
   - Consume tokens from `tokens.css` rather than hard-coded values when possible.
   - For larger files, split into:
     - `FeatureName.base.css` (default/base selectors)
     - `FeatureName.responsive.css` (media-query overrides)

## Naming

1. Token prefixes
   - Colors: `--color-*`
   - Spacing: `--space-*`
   - Radius: `--radius-*`
   - Shadows: `--shadow-*`
   - Motion: `--motion-*`
   - Layering: `--z-*`

2. Selector conventions
   - Use feature-scoped class roots (for example `.trade-list-view`, `.wanted-list-view`).
   - Avoid styling raw element selectors globally.

## File Size Guidance

1. Prefer keeping feature CSS files under ~500 lines.
2. If a file grows beyond that:
   - Split by responsibility (layout, components, responsive overrides).
   - Keep media-query blocks in the closest relevant file.

## Change Rules

1. For new styling work:
   - Choose an existing token first.
   - Add a new token only if reuse is expected.
2. Do not duplicate hard-coded brand colors or elevation values across files.
3. Run `npm run lint:styles` before merging styling-heavy changes.
