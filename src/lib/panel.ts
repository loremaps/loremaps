/**
 * Slide-over panel that shows POI content next to the map. Plain DOM — it
 * lives outside the Leaflet container so map interactions are unaffected.
 */
export class SidePanel {
  private root: HTMLElement;
  private titleEl: HTMLElement;
  private bodyEl: HTMLElement;

  constructor(host: HTMLElement, opts: { onNavigate?: (page: string) => void } = {}) {
    const root = (this.root = document.createElement('aside'));
    root.className = 'lm-panel';
    root.hidden = true;
    root.innerHTML =
      `<header class="lm-panel__header">` +
      `<h2 class="lm-panel__title"></h2>` +
      `<button type="button" class="lm-panel__close" aria-label="Close panel">&#x2715;</button>` +
      `</header>` +
      `<div class="lm-panel__body"></div>`;
    host.appendChild(root);

    this.titleEl = root.querySelector('.lm-panel__title')!;
    this.bodyEl = root.querySelector('.lm-panel__body')!;

    root.querySelector('.lm-panel__close')!.addEventListener('click', () => this.close());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.root.hidden) this.close();
    });

    // In-panel wiki navigation: intercept links the sanitizer tagged.
    this.bodyEl.addEventListener('click', (e) => {
      const link = (e.target as HTMLElement).closest<HTMLElement>('a[data-wiki-page]');
      if (link?.dataset.wikiPage && opts.onNavigate) {
        e.preventDefault();
        opts.onNavigate(link.dataset.wikiPage);
      }
    });
  }

  open(title: string): void {
    this.titleEl.textContent = title;
    this.root.hidden = false;
  }

  setLoading(): void {
    const p = document.createElement('p');
    p.className = 'lm-panel__loading';
    p.textContent = 'Consulting the archives…';
    this.setContent(p);
  }

  setContent(...nodes: (Node | string)[]): void {
    this.bodyEl.replaceChildren(...nodes);
    this.bodyEl.scrollTop = 0;
  }

  close(): void {
    this.root.hidden = true;
  }
}
