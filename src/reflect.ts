/* eslint-disable @typescript-eslint/no-explicit-any */
import { Resolver } from './resolve';

export const META_PERSISTED = '__PERSISTED__';
export const META_RESOLVER = '__RESOLVER__';

/**
 * Returns true if the "peristed" meta data of a fixture contains
 * true.
 *
 * @param target Fixture.
 */
export function isPersisted(target: Record<string, any>): boolean {
  return Reflect.getMetadata(META_PERSISTED, target);
}

/**
 * Returns true if the given target object is marked as a fixture,
 * otherwise false.
 *
 * @param target Maybe fixture.
 */
export function isFixture(target: Record<string, any>): boolean {
  return Reflect.hasMetadata(META_PERSISTED, target);
}

/**
 * Sets the "persisted" meta data of a fixture.
 *
 * @param target Fixture.
 * @param value Value.
 */
export function setPersisted(
  target: Record<string, any>,
  value: boolean,
): void {
  Reflect.defineMetadata(META_PERSISTED, value, target);
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
