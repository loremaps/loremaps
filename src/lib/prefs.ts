/** User preferences persisted in localStorage (currently just units). */

export type Units = 'imperial' | 'metric';

const STORAGE_KEY = 'loremaps.units';
const listeners: Array<(units: Units) => void> = [];

export function getUnits(): Units {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'metric' ? 'metric' : 'imperial';
  } catch {
    return 'imperial';
  }
}

export function setUnits(units: Units): void {
  try {
    localStorage.setItem(STORAGE_KEY, units);
  } catch {
    /* private browsing: keep going, just not persisted */
  }
  for (const cb of listeners) cb(units);
}

export function toggleUnits(): Units {
  const next: Units = getUnits() === 'imperial' ? 'metric' : 'imperial';
  setUnits(next);
  return next;
}

export function onUnitsChange(cb: (units: Units) => void): void {
  listeners.push(cb);
}

export function unitLabel(units: Units = getUnits()): string {
  return units === 'imperial' ? 'mi' : 'km';
}

/** Meters in one display unit (mile or kilometer). */
export function metersPerUnit(units: Units = getUnits()): number {
  return units === 'imperial' ? 1609.344 : 1000;
}

export function formatDistance(meters: number, units: Units = getUnits()): string {
  const value = meters / metersPerUnit(units);
  const rounded = value >= 100 ? Math.round(value) : value >= 10 ? value.toFixed(1) : value.toFixed(2);
  return `${rounded} ${unitLabel(units)}`;
}
