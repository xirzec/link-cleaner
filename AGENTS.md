# Link Cleaner agent guide

## Project summary

Link Cleaner is a static, mobile-first Astro application for removing tracking query
parameters before sharing a URL.

- Repository: `https://github.com/xirzec/link-cleaner`
- Production: `https://xirzec.github.io/link-cleaner/`
- Stack: Astro, strict TypeScript, plain browser APIs, CSS, Vitest, and npm.
- There is no UI framework, router, backend, database, analytics, or external runtime
  service.

`AGENTS.md` is canonical. `CLAUDE.md` intentionally mirrors it for agent
compatibility, and `.github/copilot-instructions.md` points Copilot here. Keep the
mirrored files synchronized when changing repository guidance.

All URL processing must remain local to the browser. Do not fetch a pasted URL,
follow redirects, upload or persist links, or add analytics.

## Product invariants

- Accept HTTP and HTTPS URLs plus bare domains; prepend `https://` to bare domains.
- Reject other schemes with visible, accessible feedback.
- Preserve paths, fragments, functional query parameters, ordering, repeated values,
  and the first-seen spelling of grouped parameter names.
- The recommended preset removes known tracking keys. The deliberately broad global
  policy includes ambiguous referral keys such as `ref`, `source`, and `tag`.
- "Remove all" must remain reversible. Users can review grouped parameter keys and
  restore or remove every repeated value for a key by tapping its chip.
- Manual chip changes are a custom selection; the Recommended and Remove all buttons
  restore their complete preset selections.
- Ambiguous short social keys such as YouTube's `is` and X's `s`/`t` must be scoped
  to verified hostnames. Do not add generic short keys to the global list.
- Paste, Clear, Copy, validation, clipboard-denied, and empty states must be explicit.
  Never report clipboard success unless the browser API succeeded.
- Keep the interaction compact and mobile-first. Avoid adding static content above
  the cleaner, preserve 44px touch targets, visible focus, live-region feedback,
  dark mode, reduced motion, and no horizontal overflow.

## Architecture

| Path | Responsibility |
| --- | --- |
| `src/lib/tracking-parameters.ts` | Case-insensitive global and hostname-scoped tracking rules |
| `src/lib/clean-url.ts` | Pure URL parsing, grouped query analysis, presets, and reversible reconstruction |
| `src/lib/clean-url.test.ts` | URL-policy and selection-model unit coverage |
| `src/components/LinkCleaner.astro` | Semantic controls and the small client-side DOM controller |
| `src/styles/global.css` | Mobile-first visual system and interaction states |
| `src/pages/index.astro` | Static page shell and metadata |
| `astro.config.mjs` | Local root build and dynamic GitHub Pages project base |
| `.github/workflows/deploy.yml` | Validation and GitHub Pages deployment from `main` |

Keep URL policy in the pure library. The Astro component should consume typed results
and must not duplicate parsing or tracking rules.

`analyzeUrl()` retains the normalized source URL and groups query entries by
case-insensitive key. `getPresetSelection()` creates the Recommended or Remove all
selection. `applyParameterSelection()` reconstructs the URL from the original entries
so restoring a grouped key restores all values without losing order.

## Editing tracking rules

- Store rule names in lowercase; matching is case-insensitive.
- Add globally distinctive keys, or intentionally broad product-policy keys, to
  `TRACKING_PARAMETER_NAMES`.
- Put ambiguous keys in `SOCIAL_HOST_TRACKING_PARAMETERS` and list only verified
  platform domains. Domain matching intentionally allows exact hosts and subdomains
  while rejecting lookalike suffixes.
- Add positive tests for every new rule category.
- Add negative hostname tests whenever a rule could be functional elsewhere.
- Preserve functional identifiers such as YouTube's video `v` and playback timestamp
  `t`.

## Development

Node.js 22.12 or newer is required. After a fresh checkout:

```sh
npm ci
npm run validate
```

Useful commands:

| Command | Purpose |
| --- | --- |
| `npm test` | Run the Vitest suite |
| `npm run check` | Run Astro and TypeScript diagnostics |
| `npm run build` | Build the static site |
| `npm run validate` | Run tests, checks, and build |

When starting the development server, use Astro's background mode:

```sh
npm exec astro -- dev --background --host 127.0.0.1
```

Manage it with:

```sh
npm exec astro -- dev status
npm exec astro -- dev logs
npm exec astro -- dev stop
```

Use the browser preview for interaction changes. Exercise the empty state, a valid
tracked URL, preset changes, chip restoration, and clipboard failure paths relevant
to the edit.

## Deployment and repository workflow

- `main` deploys automatically to GitHub Pages through
  `.github/workflows/deploy.yml`.
- `astro.config.mjs` derives the owner host and repository base path from
  `GITHUB_REPOSITORY`; do not hard-code a local base or publish a `gh-pages` branch.
- Run `npm run validate` before committing.
- Keep dependencies minimal and update README behavior notes with user-visible
  changes.
- Never push or otherwise update the remote without the user's explicit approval.
  Local commits are allowed.

## References

- Astro documentation: https://docs.astro.build
- GitHub Pages deployment:
  https://docs.astro.build/en/guides/deploy/github/
