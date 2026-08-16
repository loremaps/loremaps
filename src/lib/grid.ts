import * as L from 'leaflet';
import type { RasterCoords } from './raster';
import { getUnits, metersPerUnit, onUnitsChange, unitLabel } from './prefs';

export type GridType = 'none' | 'hex' | 'square';

const HEX_ICON =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="17" height="17" ` +
  `fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">` +
  `<path d="M12 2l8.5 5v10L12 22l-8.5-5V7z"/></svg>`;

/** Refuse to draw more cells than this per viewport (keeps redraws snappy). */
const MAX_CELLS = 6000;

const LINE_STYLE: L.PolylineOptions = {
  color: '#141210',
  weight: 1,
  opacity: 0.45,
  fill: false,
  interactive: false,
};

/**
 * Hex/square grid overlay for travel-pace estimation ("the party covers two
 * hexes a day"). The grid is generated in image pixel space, anchored at the
 * image origin (so it doesn't shift while panning), and only for the visible
 * viewport, redrawn on move/zoom. Hex cell size is measured across flats,
 * which equals the distance between adjacent hex centers.
 */
export class GridControl extends L.Control {
  private map!: L.Map;
  private renderer = L.canvas({ padding: 0.2 });
  private layer?: L.LayerGroup;
  private gridType: GridType = 'none';
  private cellSize = 60; // in current display units (mi or km)
  private button!: HTMLElement;
  private labelEl!: HTMLElement;
  private hintEl!: HTMLElement;

  constructor(
    private rc: RasterCoords,
    private metersPerPixel: number,
    private onChange?: (type: GridType, cellSize: number, units: string) => void,
  ) {
    super({ position: 'topleft' });
  }

  private report(): void {
    this.onChange?.(this.gridType, this.cellSize, getUnits());
  }

  override onAdd(map: L.Map): HTMLElement {
    this.map = map;
    const root = L.DomUtil.create('div', 'leaflet-bar lm-grid');
    L.DomEvent.disableClickPropagation(root);
    L.DomEvent.disableScrollPropagation(root);

    this.button = L.DomUtil.create('a', 'lm-grid__btn', root);
    this.button.setAttribute('href', '#');
    this.button.setAttribute('role', 'button');
    this.button.title = 'Grid overlay';
    this.button.innerHTML = HEX_ICON;

    const panel = L.DomUtil.create('div', 'lm-grid__panel', root);
    panel.hidden = true;
    this.button.addEventListener('click', (e) => {
      e.preventDefault();
      panel.hidden = !panel.hidden;
    });

    const seg = L.DomUtil.create('div', 'lm-grid__seg', panel);
    const options: Array<[GridType, string]> = [
      ['none', 'Off'],
      ['hex', 'Hex'],
      ['square', 'Square'],
    ];
    for (const [type, text] of options) {
      const b = L.DomUtil.create('button', 'lm-grid__segbtn', seg);
      b.type = 'button';
      b.textContent = text;
      if (type === this.gridType) b.classList.add('is-active');
      b.addEventListener('click', () => {
        this.gridType = type;
        seg.querySelectorAll('button').forEach((el) => el.classList.toggle('is-active', el === b));
        this.button.classList.toggle('is-on', type !== 'none');
        this.update();
        this.report();
      });
    }

    this.labelEl = L.DomUtil.create('div', 'lm-grid__label', panel);

    const slider = L.DomUtil.create('input', 'lm-grid__slider', panel);
    slider.type = 'range';
    slider.min = '10';
    slider.max = '300';
    slider.step = '5';
    slider.value = String(this.cellSize);
    slider.addEventListener('input', () => {
      this.cellSize = Number(slider.value);
      this.updateLabel();
    });
    slider.addEventListener('change', () => {
      this.render();
      // A resize is only meaningful once a grid is actually showing.
      if (this.gridType !== 'none') this.report();
    });

    this.hintEl = L.DomUtil.create('div', 'lm-grid__hint', panel);

    map.on('moveend zoomend', this.render, this);
    onUnitsChange(() => this.update());
    this.updateLabel();
    return root;
  }

  private update(): void {
    this.updateLabel();
    this.render();
  }

  private updateLabel(): void {
    const cell = this.gridType === 'square' ? 'square' : 'hex';
    this.labelEl.textContent = `1 ${cell} ≈ ${this.cellSize} ${unitLabel(getUnits())}`;
  }

  private render(): void {
    this.layer?.remove();
    this.layer = undefined;
    this.hintEl.textContent = '';
    if (this.gridType === 'none') return;

    const cellPx = (this.cellSize * metersPerUnit(getUnits())) / this.metersPerPixel;

    // Visible viewport in image pixel space, clipped to the image.
    const viewBounds = this.map.getBounds();
    const nw = this.rc.project(viewBounds.getNorthWest());
    const se = this.rc.project(viewBounds.getSouthEast());
    const minX = Math.max(0, nw.x);
    const minY = Math.max(0, nw.y);
    const maxX = Math.min(this.rc.width, se.x);
    const maxY = Math.min(this.rc.height, se.y);
    if (minX >= maxX || minY >= maxY) return;

    const paths =
      this.gridType === 'hex'
        ? this.hexPaths(minX, minY, maxX, maxY, cellPx)
        : this.squarePaths(minX, minY, maxX, maxY, cellPx);

    if (!paths) {
      this.hintEl.textContent = 'Too many cells to draw — zoom in or increase the cell size.';
      return;
    }
    this.layer = L.layerGroup(paths).addTo(this.map);
  }

  private toLatLngs(points: Array<[number, number]>): L.LatLng[] {
    return points.map((p) => this.rc.unproject(p));
  }

  private hexPaths(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    cellPx: number,
  ): L.Layer[] | null {
    // Flat-top hexes: across-flats = cellPx, circumradius R = cellPx / √3.
    const R = cellPx / Math.sqrt(3);
    const colStep = 1.5 * R;
    const rowStep = Math.sqrt(3) * R;

    const i0 = Math.floor((minX - R) / colStep);
    const i1 = Math.ceil((maxX + R) / colStep);
    const j0 = Math.floor((minY - rowStep) / rowStep);
    const j1 = Math.ceil((maxY + rowStep) / rowStep);
    if ((i1 - i0 + 1) * (j1 - j0 + 1) > MAX_CELLS) return null;

    const style = { ...LINE_STYLE, renderer: this.renderer };
    const layers: L.Layer[] = [];
    for (let i = i0; i <= i1; i++) {
      const odd = ((i % 2) + 2) % 2 === 1;
      for (let j = j0; j <= j1; j++) {
        const cx = i * colStep;
        const cy = j * rowStep + (odd ? rowStep / 2 : 0);
        const vertices: Array<[number, number]> = [];
        for (let k = 0; k < 6; k++) {
          const angle = (Math.PI / 3) * k;
          vertices.push([cx + R * Math.cos(angle), cy + R * Math.sin(angle)]);
        }
        layers.push(L.polygon(this.toLatLngs(vertices), style));
      }
    }
    return layers;
  }

  private squarePaths(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    cellPx: number,
  ): L.Layer[] | null {
    const cols = (maxX - minX) / cellPx;
    const rows = (maxY - minY) / cellPx;
    if (cols * rows > MAX_CELLS) return null;

    const style = { ...LINE_STYLE, renderer: this.renderer };
    const layers: L.Layer[] = [];
    for (let x = Math.ceil(minX / cellPx) * cellPx; x <= maxX; x += cellPx) {
      layers.push(L.polyline(this.toLatLngs([[x, minY], [x, maxY]]), style));
    }
    for (let y = Math.ceil(minY / cellPx) * cellPx; y <= maxY; y += cellPx) {
      layers.push(L.polyline(this.toLatLngs([[minX, y], [maxX, y]]), style));
    }
    return layers;
  }
}
