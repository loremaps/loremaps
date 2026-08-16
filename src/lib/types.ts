/**
 * The data-driven map schema. Every map on the site is described by a
 * `MapDefinition`; the Leaflet runtime is map-agnostic and only consumes
 * this shape. This is deliberately JSON-serializable so that in the future
 * user-created maps can be stored/uploaded as plain JSON documents.
 */

export interface MapImageDef {
  /** Source image width in pixels. */
  width: number;
  /** Source image height in pixels. */
  height: number;
  /** Base URL of a gdal2tiles-style XYZ pyramid; tiles at `{tilesUrl}/{z}/{x}/{y}.png`. */
  tilesUrl: string;
  /** Real-world scale of the source image, used for distances, grids and the scale bar. */
  metersPerPixel: number;
  attribution?: string;
}

export interface PoiLayerDef {
  id: string;
  /** Label shown in the layer control. */
  title: string;
  /** URL of a GeoJSON FeatureCollection of Points; coordinates are image pixels [x, y]. */
  dataUrl: string;
}

/**
 * Where the article content for a POI comes from. New source types
 * (build-time snapshots, user-authored notes, ...) plug in here — see
 * `content/provider.ts`.
 */
export type ContentSourceDef =
  | {
      type: 'mediawiki';
      /** MediaWiki api.php endpoint (must allow CORS via origin=*). */
      apiUrl: string;
      /** Wiki root, used to resolve relative links/images and for "read more" links. */
      baseUrl: string;
      attribution?: string;
    }
  | { type: 'none' };

export interface MapDefinition {
  /** URL slug: the map lives at /maps/{id}/ */
  id: string;
  title: string;
  /** Short description shown on the landing page. */
  blurb: string;
  /** Landing page card image (path under /public). */
  cardImage: string;
  image: MapImageDef;
  layers: PoiLayerDef[];
  content: ContentSourceDef;
}
