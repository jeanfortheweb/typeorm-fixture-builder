import { DeepPartial } from 'typeorm';
import { setPersisted, setResolver } from './reflect';
import { Resolver } from './resolve';

/**
 * Defines a fixture.
 *
 * @param entity Entity.
 * @param data Data for entity.
 * @param resolver Custom entity resolver.
 */
export function fixture<Entity extends {}>(
  entity: new () => Entity,
  data: DeepPartial<Entity>,
  resolver?: Resolver<Entity>,
): Entity {
  const instance = new entity();

  setPersisted(instance, false);
  setResolver(instance, resolver);

  return Object.assign(instance, data);
}
