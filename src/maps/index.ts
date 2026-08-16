import type { MapDefinition } from '../lib/types';
import { faerun } from './faerun';
import { got } from './got';

/** All maps on the site. Adding a map = adding a definition here. */
export const maps: MapDefinition[] = [faerun, got];

export function getMap(id: string): MapDefinition | undefined {
  return maps.find((m) => m.id === id);
}
