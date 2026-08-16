import * as L from 'leaflet';
import { getUnits, metersPerUnit, onUnitsChange, unitLabel } from './prefs';

/**
 * Scale bar for pixel-based fantasy maps. Leaflet's built-in scale control
 * assumes Earth geodesy, so this one derives screen scale from the image's
 * meters-per-pixel and the current zoom instead.
 */
export class ScaleBarControl extends L.Control {
  private map!: L.Map;
  private bar!: HTMLElement;
  private label!: HTMLElement;

  constructor(
    private rc: { zoom: number },
    private metersPerPixel: number,
  ) {
    super({ position: 'bottomleft' });
  }

  override onAdd(map: L.Map): HTMLElement {
    this.map = map;
    const root = L.DomUtil.create('div', 'lm-scale');
    this.bar = L.DomUtil.create('div', 'lm-scale__bar', root);
    this.label = L.DomUtil.create('span', 'lm-scale__label', root);

    map.on('zoomend', this.update, this);
    onUnitsChange(() => this.update());
    this.update();
    return root;
  }

  private update(): void {
    const metersPerScreenPx = this.metersPerPixel * 2 ** (this.rc.zoom - this.map.getZoom());
    const maxWidthPx = 130;
    const unitM = metersPerUnit(getUnits());

    const nice = niceNumber((maxWidthPx * metersPerScreenPx) / unitM);
    this.bar.style.width = `${(nice * unitM) / metersPerScreenPx}px`;
    this.label.textContent = `${nice} ${unitLabel(getUnits())}`;
  }
}

/** Largest 1/2/5 × 10ⁿ that is ≤ x. */
function niceNumber(x: number): number {
  const pow10 = 10 ** Math.floor(Math.log10(x));
  const d = x / pow10;
  return (d >= 5 ? 5 : d >= 2 ? 2 : 1) * pow10;
}
