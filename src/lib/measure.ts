import * as L from 'leaflet';
import { formatDistance, onUnitsChange } from './prefs';

const RULER_ICON =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="17" height="17" ` +
  `fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">` +
  `<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2m1-5 2 2m1-5 2 2"/></svg>`;

const LINE_COLOR = '#e0563f';

/**
 * Click-to-measure tool. Click adds a vertex, double-click / Enter / Escape
 * finishes; the finished line stays on the map until the next measurement.
 * Distances come from the injected `distance` function, which converts via
 * the map's meters-per-pixel scale (fantasy maps are flat planes — plain
 * Euclidean distance, no geodesy).
 */
export class MeasureControl extends L.Control {
  private map!: L.Map;
  private button!: HTMLElement;
  private active = false;
  private points: L.LatLng[] = [];
  private totalMeters = 0;
  private line?: L.Polyline;
  private preview?: L.Polyline;
  private vertices?: L.LayerGroup;
  private tooltip?: L.Tooltip;

  constructor(
    private distance: (a: L.LatLng, b: L.LatLng) => number,
    private onFinish?: (meters: number, points: number) => void,
  ) {
    super({ position: 'topleft' });
  }

  override onAdd(map: L.Map): HTMLElement {
    this.map = map;
    const root = L.DomUtil.create('div', 'leaflet-bar lm-measure');
    L.DomEvent.disableClickPropagation(root);

    this.button = L.DomUtil.create('a', 'lm-measure__btn', root);
    this.button.setAttribute('href', '#');
    this.button.setAttribute('role', 'button');
    this.button.title = 'Measure distance';
    this.button.innerHTML = RULER_ICON;
    this.button.addEventListener('click', (e) => {
      e.preventDefault();
      this.active ? this.cancel() : this.start();
    });

    onUnitsChange(() => this.updateTooltip());
    return root;
  }

  private start(): void {
    this.clear();
    this.active = true;
    this.button.classList.add('is-active');
    this.map.getContainer().classList.add('lm-measuring');
    this.map.doubleClickZoom.disable();

    this.line = L.polyline([], { color: LINE_COLOR, weight: 3 }).addTo(this.map);
    this.preview = L.polyline([], {
      color: LINE_COLOR,
      weight: 2,
      opacity: 0.6,
      dashArray: '6 6',
      interactive: false,
    }).addTo(this.map);
    this.vertices = L.layerGroup().addTo(this.map);

    this.map.on('click', this.onClick, this);
    this.map.on('mousemove', this.onMove, this);
    this.map.on('dblclick', this.onDblClick, this);
    document.addEventListener('keydown', this.onKey);
  }

  private stop(): void {
    this.active = false;
    this.button.classList.remove('is-active');
    this.map.getContainer().classList.remove('lm-measuring');
    this.map.off('click', this.onClick, this);
    this.map.off('mousemove', this.onMove, this);
    this.map.off('dblclick', this.onDblClick, this);
    document.removeEventListener('keydown', this.onKey);
    this.preview?.remove();
    this.preview = undefined;
    // re-enable on the next tick so the finishing dblclick doesn't zoom
    setTimeout(() => this.map.doubleClickZoom.enable(), 0);
  }

  /** Finish and keep the measured line on the map. */
  private finish(): void {
    if (this.points.length < 2) {
      this.cancel();
      return;
    }
    this.stop();
    const last = this.points[this.points.length - 1]!;
    this.tooltip?.setLatLng(last);
    this.updateTooltip();
    this.onFinish?.(this.totalMeters, this.points.length);
  }

  /** Abort and remove everything. */
  private cancel(): void {
    this.stop();
    this.clear();
  }

  private clear(): void {
    this.line?.remove();
    this.vertices?.remove();
    this.tooltip?.remove();
    this.line = this.vertices = undefined;
    this.tooltip = undefined;
    this.points = [];
    this.totalMeters = 0;
  }

  private onClick(e: L.LeafletMouseEvent): void {
    const last = this.points[this.points.length - 1];
    // ignore the duplicate click that precedes a double-click
    if (last && this.map.latLngToContainerPoint(last).distanceTo(e.containerPoint) < 5) return;

    if (last) this.totalMeters += this.distance(last, e.latlng);
    this.points.push(e.latlng);
    this.line!.addLatLng(e.latlng);
    this.vertices!.addLayer(
      L.circleMarker(e.latlng, {
        radius: 4,
        color: LINE_COLOR,
        weight: 2,
        fillColor: '#f5eeda',
        fillOpacity: 1,
        interactive: false,
      }),
    );

    if (!this.tooltip) {
      this.tooltip = L.tooltip({
        permanent: true,
        direction: 'top',
        offset: [0, -8],
        className: 'lm-measure-tip',
      })
        .setLatLng(e.latlng)
        .addTo(this.map);
    }
    this.tooltip.setLatLng(e.latlng);
    this.updateTooltip();
  }

  private onMove(e: L.LeafletMouseEvent): void {
    const last = this.points[this.points.length - 1];
    if (!last || !this.preview) return;
    this.preview.setLatLngs([last, e.latlng]);
    this.tooltip?.setLatLng(e.latlng);
    this.tooltip?.setContent(formatDistance(this.totalMeters + this.distance(last, e.latlng)));
  }

  private onDblClick(e: L.LeafletMouseEvent): void {
    L.DomEvent.stop(e.originalEvent);
    this.finish();
  }

  private onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' || e.key === 'Enter') this.finish();
  };

  private updateTooltip(): void {
    if (this.tooltip && this.points.length) {
      this.tooltip.setContent(formatDistance(this.totalMeters));
    }
  }
}
