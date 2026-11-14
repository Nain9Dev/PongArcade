# Installable site (Android and iOS)

Status: Implemented on `feat/pwa-install-pong`, not merged
Owner: naindev

## Problem

The game plays on a phone since spec 001, but a phone cannot keep it like an app. The site
publishes no web app manifest, so Chrome offers no install: asked on 2026-11-13 through the
DevTools protocol (`Page.getInstallabilityErrors`), `https://pong.naindev.com/` answers
`no-manifest`.

The owner wants every public product site of the ecosystem (`*.naindev.com`) to install from the
browser on Android Chrome and iOS Safari: its own icon and name on the home screen, and a window
with no browser bar. The portfolio (`Nain9Dev/nain9dev.github.io`) carries the reference
implementation and, in its own install spec, the shared contract with the browser criteria behind
it. This spec applies that contract to this site.

## Scope

A web app manifest, install icons rendered from the existing favicon, and the head tags that
Android Chrome and iOS Safari read. The game itself does not change.

## Shared contract

- Chrome on Android offers the install when the page is served over HTTPS and links a manifest
  with `name` or `short_name`, a 192 px and a 512 px icon, `start_url` and a `display` of
  `standalone`. A service worker is not required.
- iOS opens the site as an app when the manifest `display` is `standalone`. It takes the icon from
  `apple-touch-icon` and the label from `apple-mobile-web-app-title`.
- A maskable icon keeps its mark inside the centred circle whose radius is 40% of the icon width,
  and is a separate file from the icons with purpose `any`.
- Names approved by the owner on 2026-11-13: `short_name` `Pong Arcade`, the label under the
  icon, within the 12 characters no launcher truncates; `name` `Pong Arcade 3D`, what the install
  dialog shows.

## Requirements

The identifiers are the ones in `docs/10-requirements.md`.

- **REQ-020** — When a browser requests `manifest.webmanifest` at the site root, the site shall
  serve a manifest that declares `name` `Pong Arcade 3D`, `short_name` `Pong Arcade`, `display`
  `standalone`, `id`, `start_url` and `scope` `./`, `lang` `es`, `dir` `ltr`, the meta description
  of the page as `description`, and `theme_color` and `background_color` `#04050c`, the background
  the page paints first. It shall not declare `prefer_related_applications`.
- **REQ-021** — The manifest shall declare three PNG icons that exist at the declared size, one
  purpose per entry: 192 px and 512 px with purpose `any`, and 512 px with purpose `maskable`.
- **REQ-022** — The maskable icon and the 180 px `apple-touch-icon` shall be opaque edge to edge,
  and the maskable icon shall keep the mark inside the centred circle whose radius is 40% of its
  width.
- **REQ-023** — The page, in its source (`app/index.html`) and in the deployed build
  (`index.html`), shall link the manifest and the `apple-touch-icon` with paths relative to the
  site root, and shall carry `mobile-web-app-capable` and `apple-mobile-web-app-capable` set to
  `yes`, an `apple-mobile-web-app-title` equal to the manifest `short_name`,
  `apple-mobile-web-app-status-bar-style` set to `black`, and one `theme-color` equal to the
  manifest `theme_color`.

## Edge cases

- **The repository root is the site.** GitHub Pages publishes the root of `main` as it is
  (`.nojekyll`), so the manifest and `icons/` are plain files there, like `robots.txt`. No build
  step copies them, and the icons stay out of `assets/`, which every build deletes and rewrites.
- **One page.** The sitemap lists only `/`. `app/index.html` and `legacy/pong-2d-original.html`
  can be fetched by URL only because the whole root is published. The first is the source the
  build reads: it carries the tags, but its relative links resolve only from the root. The second
  is the archived 2D original and stays as it was preserved, without install tags.
- **Relative paths.** The manifest and the page use `./`, like every asset of the build, so the
  same files work under a sub-path. Chrome resolves `id`, `start_url` and `scope` to the site root.
- **Colours.** `theme_color` and `background_color` are the page background (`#04050c`). The
  icons keep the tile colour of the favicon (`#070a16`).
- **Description.** The manifest repeats the meta description word for word, "sin instalar nada"
  included: playing still needs no install. The test fails if the two texts drift apart.
- **Development.** The dev server is rooted at `app/`, so `vite.config.ts` serves the manifest and
  the icons from the root while developing. `npm run preview` serves the root itself.
- **Offline.** No service worker is registered. An installed window without network shows the
  browser's own offline screen, and no stale copy of the game can be served.

## Out of scope

- A service worker, offline play or any cache (owner decision of 2026-11-13: installable only).
- An in-page install button or iOS instructions; the browser's own install entry is the way in.
- Screenshots for the richer Android install dialog, and a store package.
- Install tags in the archived 2D original under `legacy/`.
- Renaming the page: its title and structured data keep `Pong 3D`.

## Acceptance criteria

- `npm run check` passes with `tests/site/install.spec.ts` in the suite.
- Chrome reports no installability error (`Page.getInstallabilityErrors`) for a local copy of the
  files a commit publishes.
- After the deploy, the live manifest answers 200 with a manifest media type, and the owner
  installs the site on an Android phone and on an iPhone: the icon shows the mark uncropped, the
  label reads `Pong Arcade` and the window opens with no browser bar.
