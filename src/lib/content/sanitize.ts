/**
 * Turns raw wiki HTML into a safe, panel-friendly DOM subtree:
 * strips scripts/handlers, drops wiki chrome (infoboxes, TOCs, edit links),
 * fixes Fandom's lazy-loaded images and resolves relative URLs.
 */

const REMOVE_SELECTORS = [
  'script',
  'style',
  'link',
  'meta',
  'iframe',
  'object',
  'embed',
  'form',
  'noscript',
  'nav',
  '#toc',
  '.toc',
  '.mw-editsection',
  '.mw-ext-cite-error',
  'sup.reference',
  '.reference',
  '.references',
  '.mw-references-wrap',
  'aside.portable-infobox',
  '.infobox',
  '.navbox',
  '.wikia-gallery',
  // notice/maintenance banners ("This is a Good Article!", stubs, disambigs)
  '.mbox',
  '.messagebox',
  '.notice',
  '.hatnote',
  '.dablink',
  '.metadata',
  // Forgotten Realms Wiki "Good Article" scroll decoration
  '.leftscroll',
  '.midscroll',
  '.rightscroll',
].join(',');

export function sanitizeWikiHtml(html: string, baseUrl: string): HTMLElement {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  for (const el of doc.querySelectorAll(REMOVE_SELECTORS)) el.remove();

  // Strip inline event handlers everywhere.
  for (const el of doc.body.querySelectorAll('*')) {
    for (const attr of [...el.attributes]) {
      if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
    }
  }

  for (const img of doc.body.querySelectorAll('img')) {
    // Fandom lazy-loads: the real URL sits in data-src.
    const dataSrc = img.getAttribute('data-src');
    if (dataSrc) img.setAttribute('src', dataSrc);
    img.removeAttribute('srcset');
    img.removeAttribute('data-srcset');

    const src = img.getAttribute('src') ?? '';
    if (!src || src.startsWith('data:')) {
      img.remove();
      continue;
    }
    if (src.startsWith('//')) img.setAttribute('src', `https:${src}`);
    else if (src.startsWith('/')) img.setAttribute('src', baseUrl + src);
    img.setAttribute('loading', 'lazy');
  }

  for (const a of doc.body.querySelectorAll('a')) {
    const href = a.getAttribute('href') ?? '';
    if (/^javascript:/i.test(href) || !href) {
      a.replaceWith(...a.childNodes);
      continue;
    }
    // Internal wiki links: keep them navigable inside the panel.
    const wikiMatch = href.match(/^\/wiki\/([^#?]+)/);
    if (wikiMatch?.[1]) {
      a.dataset.wikiPage = decodeURIComponent(wikiMatch[1]).replace(/_/g, ' ');
    }
    if (href.startsWith('/')) a.setAttribute('href', baseUrl + href);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  }

  const root = document.createElement('div');
  root.className = 'lm-article';
  root.append(...doc.body.childNodes);
  return root;
}
