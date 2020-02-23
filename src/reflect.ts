import { Resolver } from "./resolve";

export const META_PERSISTED = "__PERSISTED__";
export const META_RESOLVER = "__RESOLVER__";

export function isPersisted(target: Object): boolean {
  return Reflect.getMetadata(META_PERSISTED, target);
}

export function isFixture(target: Object): boolean {
  return Reflect.hasMetadata(META_PERSISTED, target);
}

export function setPersisted(target: Object, value: boolean) {
  Reflect.defineMetadata(META_PERSISTED, value, target);
}

export function setResolver(target: Object, value: Resolver | undefined) {
  Reflect.defineMetadata(META_RESOLVER, value, target);
}

export function getResolver(target: Object): Resolver | undefined {
  return Reflect.getMetadata(META_RESOLVER, target);
}
