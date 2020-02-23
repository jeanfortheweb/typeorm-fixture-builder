/* eslint-disable @typescript-eslint/no-explicit-any */
import { Resolver } from './resolve';

export const META_PERSISTED = '__PERSISTED__';
export const META_RESOLVER = '__RESOLVER__';

export function isPersisted(target: Record<string, any>): boolean {
  return Reflect.getMetadata(META_PERSISTED, target);
}

export function isFixture(target: Record<string, any>): boolean {
  return Reflect.hasMetadata(META_PERSISTED, target);
}

export function setPersisted(
  target: Record<string, any>,
  value: boolean
): void {
  Reflect.defineMetadata(META_PERSISTED, value, target);
}

export function setResolver(
  target: Record<string, any>,
  value: Resolver | undefined
): void {
  Reflect.defineMetadata(META_RESOLVER, value, target);
}

export function getResolver(target: Record<string, any>): Resolver | undefined {
  return Reflect.getMetadata(META_RESOLVER, target);
}
