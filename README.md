# LoreMaps

> LoreMaps is an attempt to help organize information on fantasy maps.

Interactive atlases for fantasy worlds: pan and zoom across tiled map images, search for
places, measure travel distances, overlay a hex or square grid — and open the lore behind
every marker, fetched live from the community wikis.

This is a from-scratch rewrite of the original ASP.NET MVC site
([`aspnet-mvc-live`](https://github.com/loremaps/LoreMaps/tree/aspnet-mvc-live) branch)
as a fully static site.

## Stack

- [Astro](https://astro.build) — static site generation, zero JS outside the map runtime
- [Leaflet 1.9](https://leafletjs.com) — the only runtime dependency; every plugin the old
  site used (draw, search, sidebar, rastercoords, turf hexgrid) has been replaced with
  small dependency-free TypeScript modules in `src/lib/`
- Map tiles are gdal2tiles XYZ pyramids served from GitHub Pages (same tiles as the old site)
- POI content is fetched at runtime from MediaWiki APIs via CORS (`origin=*`) — no JSONP

## Develop

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # static output in dist/
npm run preview   # serve dist/
npx astro check   # typecheck
```

## Architecture

Everything is driven by `MapDefinition` (see `src/lib/types.ts`): a JSON-serializable
description of a map — image size, tile URL, meters-per-pixel scale, POI layers, and a
content source. The Leaflet runtime (`src/lib/fantasy-map.ts`) is map-agnostic and only
consumes that shape.

```
src/maps/          map registry: one MapDefinition per map (faerun, got)
src/lib/           map runtime: raster coords, search, measure, grid, panel, scale, units
src/lib/content/   pluggable content providers (MediaWiki adapter + sanitizer)
public/data/       POI GeoJSON per map; Point coordinates are image pixels [x, y]
src/pages/         landing page + /maps/[id] generated from the registry
```

### Adding a map

1. Generate an XYZ tile pyramid from your map image (`gdal2tiles.py --xyz -p raster ...`)
   and host it anywhere with CORS.
2. Drop POI GeoJSON files under `public/data/<id>/` (Point features, pixel coordinates,
   a `name` property per feature).
3. Add a `MapDefinition` in `src/maps/` and register it in `src/maps/index.ts`.

### Extensibility notes (future work)

- **User-uploaded maps** — `MapDefinition` is plain JSON, so uploaded maps are just stored
  definitions + tiles; the runtime already renders any definition it is handed.
- **POI content authoring / offline snapshots** — implement the `ContentProvider` interface
  (`src/lib/content/provider.ts`) and register the new source type; the wiki adapter is one
  such provider, a static or user-authored source slots in beside it.
- **Fog of war** — the grid overlay shows the pattern: self-contained Leaflet control +
  layer modules attached in `fantasy-map.ts`; a fog overlay would be another such module.

## Credits

- Faerûn map image by [Pocket Plane Group](http://www.pocketplane.net/); lore from the
  [Forgotten Realms Wiki](https://forgottenrealms.fandom.com)
- Known World map by [serMountainGoat](http://www.sermountaingoat.co.uk/) (CC-BY-NC-SA);
  lore from [A Wiki of Ice and Fire](https://awoiaf.westeros.org)
- Raster coordinate approach based on
  [leaflet-rastercoords](https://github.com/commenthol/leaflet-rastercoords) by commenthol
