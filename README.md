# Link Cleaner

Link Cleaner is a small Astro app that removes tracking parameters from links before
you share them. It runs entirely in the browser: links are not uploaded, stored, or
sent to another service.

## Features

- Cleans links immediately as you type or paste.
- Accepts HTTP(S) links and bare domains.
- Removes a broad local list of analytics, advertising, referral, affiliate, and
  share parameters.
- Preserves ordinary query parameters by default.
- Offers presets to restore the recommended cleanup or remove every query parameter.
- Lets users review grouped parameter keys and tap to keep or remove them.
- Preserves repeated values when a grouped parameter is restored.
- Copies the customized result to the clipboard.

The default list intentionally includes ambiguous referral keys such as `ref`,
`source`, and `tag`. The parameter review UI can restore any key that a destination
needs.

## Local development

Node.js 22.12 or newer is required.

```sh
npm install
npm run dev
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Astro development server |
| `npm test` | Run the URL-cleaning unit tests |
| `npm run check` | Run Astro and TypeScript checks |
| `npm run build` | Build the static site in `dist/` |
| `npm run validate` | Run tests, checks, and the production build |

Tracking rules live in `src/lib/tracking-parameters.ts`. Add or remove entries there
and update `src/lib/clean-url.test.ts` when the policy changes.

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` validates and deploys the site when
changes reach `main`, and it can also be run manually.

1. Push this project to a GitHub repository whose default branch is `main`.
2. Open the repository's **Settings -> Pages**.
3. Set **Source** to **GitHub Actions**.

The Astro configuration derives the owner and repository path from
`GITHUB_REPOSITORY`, so a project site is built for
`https://<owner>.github.io/<repository>/` without hard-coded account details.
