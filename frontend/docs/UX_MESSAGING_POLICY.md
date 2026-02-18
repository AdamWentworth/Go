# Frontend UX Messaging Policy

This policy defines how user-facing messages should be shown in production.

## Goals

- Keep feedback consistent across the app.
- Avoid blocking native browser dialogs.
- Preserve Pokemon Go style interactions where it improves UX clarity.

## Messaging Standard

1. `ModalContext.confirm`
- Use for user decisions and destructive actions.
- Examples: delete account, deny/cancel/complete trade confirmations.

2. `ModalContext.alert`
- Use for blocking in-flow messages that require acknowledgement.
- Examples: validation gates during instance/fusion/trade interactions.

3. Toast notifications (`react-toastify`)
- Use for non-blocking system feedback.
- Examples: save/copy success, background sync warnings, session notices.

4. Inline form errors
- Use for field-level validation and correction hints.
- Avoid modal/toast for simple field mistakes when inline messaging is clearer.

## Banned in `src/`

- `alert()`
- `confirm()`
- `prompt()`
- `window.alert()`
- `window.confirm()`
- `window.prompt()`

ESLint enforces this in `frontend/eslint.config.mjs`.

## Exceptions

- Tests may mock browser APIs if needed.
- Non-UI infrastructure code should prefer structured errors and caller-provided notifiers.
