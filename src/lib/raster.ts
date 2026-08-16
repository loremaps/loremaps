import * as L from 'leaflet';

/**
 * Maps image pixel coordinates onto Leaflet's coordinate space for a
 * gdal2tiles-style XYZ tile pyramid (origin top-left, y grows downwards).
 *
 * At `zoom` (the pyramid's deepest level) one Leaflet projected unit equals
 * one image pixel, so POI data stored as pixel coordinates round-trips
 * exactly. Same approach as the leaflet-rastercoords plugin by commenthol.
 */
export class RasterCoords {
  /** Zoom level at which the image is shown at native resolution. */
  readonly zoom: number;

  constructor(
    private map: L.Map,
    readonly width: number,
    readonly height: number,
    tileSize = 256,
  ) {
    this.zoom = Math.ceil(Math.log2(Math.max(width, height) / tileSize));
  }

  /** Image pixel [x, y] -> LatLng. */
  unproject(point: [number, number]): L.LatLng {
    return this.map.unproject(point, this.zoom);
  }

  /** LatLng -> image pixel point. */
  project(latlng: L.LatLngExpression): L.Point {
    return this.map.project(latlng, this.zoom);
  }

  /** The image extent as map bounds. */
  get bounds(): L.LatLngBounds {
    return L.latLngBounds(this.unproject([0, 0]), this.unproject([this.width, this.height]));
  }
}
