import * as L from 'leaflet';
import { onUnitsChange, toggleUnits, unitLabel } from './prefs';

/** Tiny mi/km toggle; every distance-aware control listens for the change. */
export class UnitsControl extends L.Control {
  constructor() {
    super({ position: 'topleft' });
  }

  override onAdd(): HTMLElement {
    const root = L.DomUtil.create('div', 'leaflet-bar lm-units');
    L.DomEvent.disableClickPropagation(root);

    const btn = L.DomUtil.create('a', 'lm-units__btn', root);
    btn.setAttribute('href', '#');
    btn.setAttribute('role', 'button');
    btn.title = 'Switch between miles and kilometers';
    btn.textContent = unitLabel();

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleUnits();
    });
    onUnitsChange((units) => {
      btn.textContent = unitLabel(units);
    });

    return root;
  }
}
