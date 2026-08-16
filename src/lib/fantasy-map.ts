import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/map.css';

import type { MapDefinition, PoiLayerDef } from './types';
import { RasterCoords } from './raster';
import { layerColor, poiIcon } from './markers';
import { SidePanel } from './panel';
import { createContentProvider, type ContentProvider } from './content/provider';
import { SearchControl, type SearchEntry } from './search';
import { MeasureControl } from './measure';
import { GridControl } from './grid';
import { ScaleBarControl } from './scale';
import { UnitsControl } from './units';

/** Entry point for /maps/[id] pages: reads the embedded JSON definition. */
export function initMapPage(): void {
  const config = document.getElementById('map-config')?.textContent;
  const container = document.getElementById('map');
  if (!config || !container) throw new Error('Map page is missing #map or #map-config');
  createFantasyMap(container, JSON.parse(config) as MapDefinition);
}

export function createFantasyMap(container: HTMLElement, def: MapDefinition): L.Map {
  const map = L.map(container, { zoomControl: false, minZoom: 0 });
  const rc = new RasterCoords(map, def.image.width, def.image.height);

  map.setMaxZoom(rc.zoom + 1); // allow one level of over-zoom past native tiles
  map.setMaxBounds(rc.bounds.pad(0.1));
  map.fitBounds(rc.bounds);

  L.tileLayer(`${def.image.tilesUrl}/{z}/{x}/{y}.png`, {
    noWrap: true,
    bounds: rc.bounds,
    maxNativeZoom: rc.zoom,
    maxZoom: rc.zoom + 1,
  }).addTo(map);

  const provider = createContentProvider(def.content);
  map.attributionControl.setPrefix('<a href="/">LoreMaps</a>');
  if (def.image.attribution) map.attributionControl.addAttribution(def.image.attribution);
  if (provider?.attribution) map.attributionControl.addAttribution(provider.attribution);

  const panel = new SidePanel(container.parentElement ?? document.body, {
    onNavigate: (page) => void openPoi(page),
  });

  async function openPoi(name: string): Promise<void> {
    panel.open(name);
    if (!provider) {
      panel.setContent('No content source is configured for this map.');
      return;
    }
    panel.setLoading();
    try {
      const article = await provider.load(name);
      panel.open(article.title);
      panel.setContent(article.element, readMoreLink(article.externalUrl));
    } catch (err) {
      panel.setContent(errorView(name, provider, err));
    }
  }

  // --- controls (top-left stack: search, measure, grid, units) ---
  const search = new SearchControl(rc.zoom);
  search.addTo(map);

  const distance = (a: L.LatLng, b: L.LatLng) =>
    rc.project(a).distanceTo(rc.project(b)) * def.image.metersPerPixel;
  new MeasureControl(distance).addTo(map);
  new GridControl(rc, def.image.metersPerPixel).addTo(map);
  new UnitsControl().addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);
  const layersControl = L.control.layers(undefined, undefined, { position: 'bottomright' }).addTo(map);
  new ScaleBarControl(rc, def.image.metersPerPixel).addTo(map);

  // --- POI layers ---
  def.layers.forEach((layerDef, index) => void addPoiLayer(layerDef, index));

  async function addPoiLayer(layerDef: PoiLayerDef, index: number): Promise<void> {
    let data: GeoJSON.FeatureCollection;
    try {
      const res = await fetch(layerDef.dataUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch (err) {
      console.warn(`LoreMaps: failed to load layer "${layerDef.title}" from ${layerDef.dataUrl}`, err);
      return;
    }

    const color = layerColor(index);
    const icon = poiIcon(color);
    const entries: SearchEntry[] = [];

    const group = L.geoJSON(data, {
      coordsToLatLng: (coords) => rc.unproject([coords[0], coords[1]]),
      pointToLayer: (_feature, latlng) => L.marker(latlng, { icon }),
      onEachFeature: (feature, layer) => {
        const name: string | undefined = feature.properties?.name;
        if (!name) return;
        layer.bindTooltip(name, { direction: 'top' });
        layer.on('click', () => void openPoi(name));
        entries.push({
          name,
          category: layerDef.title,
          latlng: (layer as L.Marker).getLatLng(),
          activate: () => layer.fire('click'),
        });
      },
    }).addTo(map);

    const swatch = `<span class="lm-swatch" style="background:${color}"></span>`;
    layersControl.addOverlay(group, `${swatch} ${layerDef.title}`);
    search.addEntries(entries);
  }

  return map;
}

function readMoreLink(url: string | undefined): HTMLElement | string {
  if (!url) return '';
  const p = document.createElement('p');
  p.className = 'lm-article__more';
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = 'Read the full article on the wiki ↗';
  p.appendChild(a);
  return p;
}

function errorView(name: string, provider: ContentProvider, err: unknown): HTMLElement {
  const wrap = document.createElement('div');
  const p = document.createElement('p');
  p.textContent = `Couldn’t load the article for “${name}” (${err instanceof Error ? err.message : 'unknown error'}).`;
  wrap.appendChild(p);
  const url = provider.pageUrl(name);
  if (url) {
    const more = readMoreLink(url);
    if (more instanceof HTMLElement) wrap.appendChild(more);
  }
  return wrap;
}
