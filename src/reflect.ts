/* eslint-disable @typescript-eslint/no-explicit-any */
import { Resolver } from './resolve';

export const META_RESOLVER = '__RESOLVER__';

/**
 * Returns true if the given target object is marked as a fixture,
 * otherwise false.
 *
 * @param target Maybe fixture.
 */
export function isFixture(target: Record<string, any>): boolean {
  return Reflect.hasMetadata(META_RESOLVER, target);
}

/**
 * Sets the "resolver" meta data of a fixture.
 *
 * @param target Fixture.
 * @param value Resolver callback.
 */
export function setResolver(
  target: Record<string, any>,
  value: Resolver | undefined,
): void {
  Reflect.defineMetadata(META_RESOLVER, value, target);
}

/**
 * Returns the resolver of a fixture.
 *
 * @param target Fixture.
 */
export function getResolver(target: Record<string, any>): Resolver | undefined {
  return Reflect.getMetadata(META_RESOLVER, target);
}
