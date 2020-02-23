import { DeepPartial } from "typeorm";

export interface Fixture {
  __persisted: boolean;
}

export function fixture<Entity extends {}>(
  entity: new () => Entity,
  data: DeepPartial<Entity>
): Entity & Fixture {
  const instance = new entity();

  return Object.assign(instance, data, {
    __persisted: false
  });
}
