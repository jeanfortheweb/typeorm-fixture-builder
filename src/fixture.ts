import { DeepPartial } from "typeorm";
import { setPersisted, setResolver } from "./reflect";
import { Resolver } from "./resolve";

export function fixture<Entity extends {}>(
  entity: new () => Entity,
  data: DeepPartial<Entity>,
  resolver?: Resolver<Entity>
): Entity {
  const instance = new entity();

  setPersisted(instance, false);
  setResolver(instance, resolver);

  return Object.assign(instance, data);
}
