import type { ContentSourceDef } from '../types';
import { MediaWikiProvider } from './mediawiki';

/** A loaded, sanitized article ready to show in the side panel. */
export interface PoiArticle {
  title: string;
  /** Sanitized DOM subtree; safe to insert as-is. */
  element: HTMLElement;
  /** Canonical page on the source site, if any. */
  externalUrl?: string;
}

/**
 * Abstracts where POI content comes from. The MediaWiki adapter is the only
 * implementation today; future sources (build-time snapshots for offline use,
 * user-authored notes, ...) implement this same interface and get registered
 * in `createContentProvider`.
 */
export interface ContentProvider {
  attribution?: string;
  /** Best-guess canonical URL for a title, usable even when `load` fails. */
  pageUrl(title: string): string | undefined;
  load(title: string): Promise<PoiArticle>;
}

export function createContentProvider(def: ContentSourceDef): ContentProvider | undefined {
  switch (def.type) {
    case 'mediawiki':
      return new MediaWikiProvider(def);
    case 'none':
      return undefined;
  }
}
