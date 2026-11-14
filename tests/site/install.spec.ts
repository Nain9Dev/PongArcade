import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decodePng, readPngHeader } from '../support/png';

/**
 * REQ-020 to REQ-023: the site installs on a phone like an app.
 * GitHub Pages serves the repository root, so the manifest and the icons are the files that
 * sit there; `app/index.html` is the source the build takes the head tags from.
 */
const MANIFEST = 'manifest.webmanifest';
const APPLE_ICON = 'icons/apple-touch-icon.png';
const MASKABLE_ICON = 'icons/icon-maskable-512.png';
const SHORT_NAME = 'Pong Arcade';
/** What the page paints first: `html { background }` and its `theme-color` meta. */
const PAGE_BACKGROUND = '#04050c';
/** One purpose per entry: Chrome asks for both `any` sizes, launchers crop the `maskable` one. */
const ICONS = [
  { src: './icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: `./${MASKABLE_ICON}`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
];
/**
 * Largest channel difference still read as the icon background. Anti-aliasing moves a channel
 * by a unit or two where the favicon tile meets the background; the mark colours are far away.
 */
const BACKGROUND_TOLERANCE = 24;

const bytes = (relative: string): Buffer =>
  readFileSync(new URL(`../../${relative}`, import.meta.url));
const text = (relative: string): string => bytes(relative).toString('utf8');
const manifest = (): Record<string, unknown> =>
  JSON.parse(text(MANIFEST)) as Record<string, unknown>;

/** Attributes of every `<link>` or `<meta>` tag outside comments, in any order and layout. */
function tags(html: string, element: 'link' | 'meta'): Record<string, string>[] {
  const markup = html.replace(/<!--[\s\S]*?-->/g, '');
  return [...markup.matchAll(new RegExp(`<${element}\\b[^>]*>`, 'g'))].map((tag) =>
    Object.fromEntries(
      [...tag[0].matchAll(/([a-z-]+)\s*=\s*"([^"]*)"/g)].map((m) => [m[1] ?? '', m[2] ?? '']),
    ),
  );
}

const hrefs = (html: string, rel: string): (string | undefined)[] =>
  tags(html, 'link')
    .filter((tag) => tag['rel'] === rel)
    .map((tag) => tag['href']);

const metas = (html: string, name: string): (string | undefined)[] =>
  tags(html, 'meta')
    .filter((tag) => tag['name'] === name)
    .map((tag) => tag['content']);

// REQ-020 and REQ-021
describe('web app manifest', () => {
  it('names the app and opens it standalone from the site root', () => {
    const app = manifest();
    expect(app['name']).toBe('Pong Arcade 3D');
    expect(app['short_name']).toBe(SHORT_NAME);
    expect(app['display']).toBe('standalone');
    // Relative, like every asset of the page, so the same files work under a sub-path.
    expect(app['start_url']).toBe('./');
    expect(app['id']).toBe(app['start_url']);
    expect(app['scope']).toBe('./');
    expect(app['lang']).toBe('es');
    expect(app['dir']).toBe('ltr');
    // A related native app would cancel the browser install.
    expect(app).not.toHaveProperty('prefer_related_applications');
  });

  it('reuses the description and the first-paint colour of the page', () => {
    const app = manifest();
    expect([app['description']]).toEqual(metas(text('app/index.html'), 'description'));
    expect(app['theme_color']).toBe(PAGE_BACKGROUND);
    expect(app['background_color']).toBe(PAGE_BACKGROUND);
  });

  it('declares a 192 px, a 512 px and a maskable icon, each a PNG of the declared size', () => {
    expect(manifest()['icons']).toEqual(ICONS);
    for (const icon of ICONS) {
      const { width, height } = readPngHeader(bytes(icon.src.slice(2)));
      expect(`${width}x${height}`, icon.src).toBe(icon.sizes);
    }
  });
});

// REQ-022
describe('install icons', () => {
  it('keeps the maskable icon opaque and its mark inside the safe zone', () => {
    const { width, height, rgba } = decodePng(bytes(MASKABLE_ICON));
    // A launcher may crop the icon down to the centred circle whose radius is 40% of its width.
    const safeRadius = width * 0.4;
    // The background is whatever the top-left corner shows.
    const differs = (at: number, channel: number): boolean =>
      Math.abs(rgba.readUInt8(at + channel) - rgba.readUInt8(channel)) > BACKGROUND_TOLERANCE;
    let transparent = 0;
    let mark = 0;
    let cropped = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const at = (y * width + x) * 4;
        if (rgba.readUInt8(at + 3) !== 255) transparent += 1;
        if (!differs(at, 0) && !differs(at, 1) && !differs(at, 2)) continue;
        mark += 1;
        if (Math.hypot(x + 0.5 - width / 2, y + 0.5 - height / 2) > safeRadius) cropped += 1;
      }
    }
    expect(transparent, 'transparent pixels, which a launcher fills with its own colour').toBe(0);
    expect(cropped, 'mark pixels outside the safe zone, which a round mask cuts').toBe(0);
    // A blank tile would satisfy both rules above.
    expect(mark, 'mark pixels').toBeGreaterThan(width * height * 0.02);
  });

  it('ships an opaque 180 px Apple icon', () => {
    const { width, height, rgba } = decodePng(bytes(APPLE_ICON));
    expect([width, height]).toEqual([180, 180]);
    let transparent = 0;
    for (let at = 3; at < rgba.length; at += 4) {
      if (rgba.readUInt8(at) !== 255) transparent += 1;
    }
    expect(transparent, 'transparent pixels, which iOS paints black').toBe(0);
  });
});

// REQ-023
for (const file of ['app/index.html', 'index.html']) {
  describe(`install tags in ${file}`, () => {
    const html = text(file);

    it('links the manifest and the Apple icon of the site root', () => {
      expect(hrefs(html, 'manifest')).toEqual([`./${MANIFEST}`]);
      expect(hrefs(html, 'apple-touch-icon')).toEqual([`./${APPLE_ICON}`]);
    });

    it('carries the home-screen metadata', () => {
      expect(metas(html, 'mobile-web-app-capable')).toEqual(['yes']);
      expect(metas(html, 'apple-mobile-web-app-capable')).toEqual(['yes']);
      expect(metas(html, 'apple-mobile-web-app-title')).toEqual([SHORT_NAME]);
      expect(metas(html, 'apple-mobile-web-app-status-bar-style')).toEqual(['black']);
      expect(metas(html, 'theme-color')).toEqual([PAGE_BACKGROUND]);
    });
  });
}
