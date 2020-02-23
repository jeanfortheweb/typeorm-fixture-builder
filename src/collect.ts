/* eslint-disable @typescript-eslint/no-explicit-any */
import { isFixture } from './reflect';

/**
 * Collects fixtures from an arbitrary object or array structure.
 * Any value inside that structure has to be either an array of fixtures or an object which
 * values lead to a fixture.
 *
 * @param value Object or Array to collect from.
 */
export function collect<Bundle, Entity>(value: Bundle): Entity[] {
  if (value && Array.isArray(value)) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return collectArray(value);
  }

  if (typeof value === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return collectObject(value);
  }

  throw new Error(`Invalid fixture definition.`);
}

/**
 * Collects fixtures from an array type.
 *
 * @param value Array.
 */
function collectArray(value: any[]): any[] {
  return value.reduce<any[]>(
    (fixtures, element) => [...fixtures, ...collect(element)],
    [],
  );
}

/**
 * Collects fixtures from an object type.
 *
 * @param value Object.
 */
function collectObject(value: any): any[] {
  if (isFixture(value)) {
    return [value];
  } else {
    return Object.values(value).reduce<any[]>(
      (fixtures, element) => [...fixtures, ...collect(element)],
      [],
    );
  }
}
