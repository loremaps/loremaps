import * as L from 'leaflet';

/**
 * Category marker icons. SVG div-icons sidestep Leaflet's bundler-hostile
 * default icon image paths and give each POI layer its own color.
 */

const PALETTE = [
  '#4fa3c7', // ports - blue
  '#e5a83b', // cities - amber
  '#5bc0a8', // port/capitals - teal
  '#e0563f', // capitals - red
  '#9a7bc8', // temples - violet
  '#d96fa4', // sites - pink
  '#8a9a5b', // fortresses - moss
  '#b3907a', // ruins - dun
];

export function layerColor(index: number): string {
  return PALETTE[index % PALETTE.length]!;
}

export function poiIcon(color: string): L.DivIcon {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34">` +
    `<path d="M13 1C6.4 1 1 6.4 1 13c0 9 12 20 12 20s12-11 12-20C25 6.4 19.6 1 13 1z" ` +
    `fill="${color}" stroke="#1a1510" stroke-width="1.5"/>` +
    `<circle cx="13" cy="13" r="4.5" fill="#f5eeda"/></svg>`;

  return L.divIcon({
    className: 'lm-pin',
    html: svg,
    iconSize: [26, 34],
    iconAnchor: [13, 33],
    tooltipAnchor: [0, -30],
  });
}
