import * as L from 'leaflet';

export interface SearchEntry {
  name: string;
  category: string;
  latlng: L.LatLng;
  /** Open the entry (typically fires the marker's click handler). */
  activate(): void;
}

/** Type-ahead search over every loaded POI. */
export class SearchControl extends L.Control {
  private entries: SearchEntry[] = [];
  private map!: L.Map;
  private input!: HTMLInputElement;
  private list!: HTMLUListElement;

  constructor(
    private targetZoom: number,
    private onSelect?: (entry: SearchEntry) => void,
  ) {
    super({ position: 'topleft' });
  }

  addEntries(entries: SearchEntry[]): void {
    this.entries.push(...entries);
  }

  override onAdd(map: L.Map): HTMLElement {
    this.map = map;
    const root = L.DomUtil.create('div', 'lm-search leaflet-control');
    L.DomEvent.disableClickPropagation(root);
    L.DomEvent.disableScrollPropagation(root);

    this.input = L.DomUtil.create('input', 'lm-search__input', root);
    this.input.type = 'search';
    this.input.placeholder = 'Search places…';
    this.input.setAttribute('aria-label', 'Search places');

    this.list = L.DomUtil.create('ul', 'lm-search__results', root);
    this.list.hidden = true;

    this.input.addEventListener('input', () => this.render());
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const first = this.list.querySelector<HTMLElement>('li');
        first?.click();
      } else if (e.key === 'Escape') {
        this.input.value = '';
        this.render();
        this.input.blur();
      }
    });

    return root;
  }

  private matches(query: string): SearchEntry[] {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return this.entries
      .filter((e) => e.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        return aStarts - bStarts || a.name.localeCompare(b.name);
      })
      .slice(0, 10);
  }

  private render(): void {
    const results = this.matches(this.input.value);
    this.list.replaceChildren(
      ...results.map((entry) => {
        const li = document.createElement('li');
        li.innerHTML = `<span></span><small></small>`;
        li.querySelector('span')!.textContent = entry.name;
        li.querySelector('small')!.textContent = entry.category;
        li.addEventListener('click', () => this.select(entry));
        return li;
      }),
    );
    this.list.hidden = results.length === 0;
  }

  private select(entry: SearchEntry): void {
    this.onSelect?.(entry);
    this.map.setView(entry.latlng, this.targetZoom);
    entry.activate();
    this.input.value = entry.name;
    this.list.hidden = true;
  }
}
