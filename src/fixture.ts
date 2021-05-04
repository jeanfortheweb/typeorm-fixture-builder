import { DeepPartial } from 'typeorm';
import { setResolver } from './reflect';
import { Resolver } from './resolve';

/**
 * Defines a fixture.
 *
 * @param entity Entity.
 * @param data Data for entity.
 * @param resolver Custom entity resolver.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fixture<Entity extends Record<string, any>>(
  entity: new () => Entity,
  data: DeepPartial<Entity>,
  resolver?: Resolver<Entity>,
): Entity {
  const instance = new entity();

  setResolver(instance, resolver);

  return Object.assign(instance, data);
}
