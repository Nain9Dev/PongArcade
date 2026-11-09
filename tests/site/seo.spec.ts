import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * REQ-015 to REQ-019: discoverability baseline of the public site.
 * GitHub Pages serves the repository root, so the deployed `index.html` and the
 * discovery files live there; `app/index.html` is the source the build starts from.
 */
const HOST = 'https://pong.naindev.com/';
const REPO = 'https://github.com/Nain9Dev/PongArcade';
const read = (relative: string): string =>
  readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

function metaContent(html: string, attr: 'name' | 'property', key: string): string[] {
  const pattern = new RegExp(`<meta\\s+${attr}="${key}"\\s+content="([^"]*)"\\s*/?>`, 'gs');
  return [...html.matchAll(pattern)].map((m) => (m[1] ?? '').replace(/\s+/g, ' ').trim());
}

for (const file of ['app/index.html', 'index.html']) {
  describe(`metadata in ${file}`, () => {
    const html = read(file);

    it('has exactly one canonical link equal to the host root', () => {
      const links = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]*)"\s*\/?>/g)];
      expect(links).toHaveLength(1);
      expect(links[0]?.[1]).toBe(HOST);
    });

    it('has one description of 70 to 160 characters', () => {
      const descriptions = metaContent(html, 'name', 'description');
      expect(descriptions).toHaveLength(1);
      const length = descriptions[0]?.length ?? 0;
      expect(length).toBeGreaterThanOrEqual(70);
      expect(length).toBeLessThanOrEqual(160);
    });

    it('declares Open Graph and Twitter card metadata that agree with the canonical', () => {
      expect(metaContent(html, 'property', 'og:type')).toEqual(['website']);
      expect(metaContent(html, 'property', 'og:site_name')).toEqual(['Pong 3D']);
      expect(metaContent(html, 'property', 'og:title')).toHaveLength(1);
      expect(metaContent(html, 'property', 'og:description')).toHaveLength(1);
      expect(metaContent(html, 'property', 'og:url')).toEqual([HOST]);
      const image = metaContent(html, 'property', 'og:image');
      expect(image).toHaveLength(1);
      expect(image[0]).toMatch(/^https:\/\/[^"]+\.(jpg|png|webp)$/);
      expect(metaContent(html, 'property', 'og:image:width')).toEqual(['1200']);
      expect(metaContent(html, 'property', 'og:image:height')).toEqual(['630']);
      expect(metaContent(html, 'name', 'twitter:card')).toEqual(['summary_large_image']);
      expect(metaContent(html, 'name', 'twitter:title')).toEqual(metaContent(html, 'property', 'og:title'));
      expect(metaContent(html, 'name', 'twitter:description')).toEqual(
        metaContent(html, 'property', 'og:description'),
      );
      expect(metaContent(html, 'name', 'twitter:image')).toEqual(image);
    });

    it('links the author', () => {
      expect(html).toMatch(/<link\s+rel="author"\s+href="https:\/\/www\.naindev\.com\/"\s*\/?>/);
    });

    it('embeds JSON-LD that parses and references the author by id', () => {
      const blocks = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
      expect(blocks).toHaveLength(1);
      const raw = blocks[0]?.[1] ?? '';
      expect(raw).not.toContain('<');
      const data = JSON.parse(raw) as Record<string, unknown>;
      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toEqual(['SoftwareApplication', 'VideoGame']);
      expect(data['url']).toBe(HOST);
      expect(data['operatingSystem']).toBe('Web');
      expect(data['isAccessibleForFree']).toBe(true);
      expect(data['inLanguage']).toBe('es');
      expect(typeof data['name']).toBe('string');
      expect(typeof data['description']).toBe('string');
      expect(typeof data['applicationCategory']).toBe('string');
      expect(JSON.stringify(data['sameAs'])).toContain(REPO);
      const author = data['author'] as Record<string, unknown>;
      expect(author['@type']).toBe('Person');
      expect(author['@id']).toBe('https://www.naindev.com/#person');
      expect(author['url']).toBe('https://www.naindev.com/');
    });
  });
}

describe('root discovery files', () => {
  it('robots.txt allows everything and advertises the sitemap', () => {
    const robots = read('robots.txt');
    expect(robots).toMatch(/^User-agent: \*\r?\nAllow: \/\r?\n/);
    expect(robots).not.toMatch(/Disallow/i);
    expect(robots).toMatch(new RegExp(`^Sitemap: ${HOST}sitemap\\.xml\\s*$`, 'm'));
  });

  it('sitemap.xml lists only the canonical root', () => {
    const locs = [...read('sitemap.xml').matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual([HOST]);
  });

  it('llms.txt starts with an H1 and a summary and links the repository and the main site', () => {
    const llms = read('llms.txt');
    expect(llms).toMatch(/^# Pong 3D\r?\n/);
    expect(llms).toMatch(/^> .+$/m);
    expect(llms).toContain(REPO);
    expect(llms).toContain('https://www.naindev.com/');
  });
});
