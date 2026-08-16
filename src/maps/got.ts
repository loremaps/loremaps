import type { MapDefinition } from '../lib/types';

const layer = (id: string, title: string) => ({
  id,
  title,
  dataUrl: `/data/got/${id}.json`,
});

export const got: MapDefinition = {
  id: 'got',
  title: 'The Known World',
  blurb:
    'Westeros and Essos from A Song of Ice and Fire, based on serMountainGoat’s speculative world map. Markers link to A Wiki of Ice and Fire.',
  cardImage: '/images/got.jpg',
  image: {
    width: 4642,
    height: 4642,
    tilesUrl: 'https://loremaps.github.io/LoreMaps-GoT-Tiles/Tiles',
    metersPerPixel: 2266.681,
    attribution:
      'Map data <a href="http://www.sermountaingoat.co.uk/">serMountainGoat</a>, <a href="http://creativecommons.org/licenses/by-nc-sa/3.0/">CC-BY-NC-SA</a>',
  },
  layers: [
    layer('cities', 'Cities'),
    layer('towns', 'Towns'),
    layer('castles', 'Castles'),
    layer('ruins', 'Ruins'),
    layer('others', 'Others'),
  ],
  content: {
    type: 'mediawiki',
    apiUrl: 'https://awoiaf.westeros.org/api.php',
    baseUrl: 'https://awoiaf.westeros.org',
    attribution: 'Info <a href="https://awoiaf.westeros.org">A Wiki of Ice and Fire</a>',
  },
};
