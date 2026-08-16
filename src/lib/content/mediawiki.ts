import type { ContentProvider, PoiArticle } from './provider';
import { sanitizeWikiHtml } from './sanitize';

interface MediaWikiSource {
  apiUrl: string;
  baseUrl: string;
  attribution?: string;
}

/**
 * Loads rendered article HTML from a MediaWiki `action=parse` endpoint.
 * `origin=*` opts into MediaWiki's anonymous CORS mode, which both Fandom
 * and standalone wikis support (no JSONP needed anymore).
 */
export class MediaWikiProvider implements ContentProvider {
  constructor(private source: MediaWikiSource) {}

  get attribution(): string | undefined {
    return this.source.attribution;
  }

  pageUrl(title: string): string {
    return `${this.source.baseUrl}/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
  }

  async load(title: string): Promise<PoiArticle> {
    const params = new URLSearchParams({
      action: 'parse',
      page: title,
      prop: 'text',
      format: 'json',
      redirects: '1',
      origin: '*',
    });

    const res = await fetch(`${this.source.apiUrl}?${params}`);
    if (!res.ok) throw new Error(`Wiki request failed (HTTP ${res.status})`);

    const data = await res.json();
    const html: string | undefined = data?.parse?.text?.['*'];
    if (!html) {
      throw new Error(data?.error?.info ?? `No article found for “${title}”`);
    }

    const resolvedTitle: string = data.parse.title ?? title;
    return {
      title: resolvedTitle,
      element: sanitizeWikiHtml(html, this.source.baseUrl),
      externalUrl: this.pageUrl(resolvedTitle),
    };
  }
}
