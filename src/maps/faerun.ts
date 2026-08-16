import type { MapDefinition } from '../lib/types';

const layer = (id: string, title: string) => ({
  id,
  title,
  dataUrl: `/data/faerun/${id}.json`,
});

export const faerun: MapDefinition = {
  id: 'faerun',
  title: 'Faerûn',
  blurb:
    'The heartland of the Forgotten Realms, from the Sword Coast to the Sea of Fallen Stars. Every marker links to the Forgotten Realms Wiki.',
  cardImage: '/images/faerun.jpg',
  image: {
    width: 4763,
    height: 3185,
    tilesUrl: 'https://loremaps.github.io/LoreMaps-Faerun-Tiles/Tiles',
    metersPerPixel: 1287.473,
    attribution: 'Map data <a href="http://www.pocketplane.net/">Pocket Plane Group</a>',
  },
  layers: [
    layer('ports', 'Ports'),
    layer('cities', 'Cities'),
    layer('portcapitals', 'Port/Capitals'),
    layer('capitals', 'Capitals'),
    layer('temples', 'Temples'),
    layer('sites', 'Sites'),
    layer('fortresses', 'Fortresses'),
    layer('ruins', 'Ruins'),
  ],
  content: {
    type: 'mediawiki',
    apiUrl: 'https://forgottenrealms.fandom.com/api.php',
    baseUrl: 'https://forgottenrealms.fandom.com',
    attribution: 'Info <a href="https://forgottenrealms.fandom.com">Forgotten Realms Wiki</a>',
  },
};
