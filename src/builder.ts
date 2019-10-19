import { EntityManager, DeepPartial, Repository } from 'typeorm';

/**
 * Async data definition function.
 */
export interface AsyncData<Entity = any> {
  (resolve: Resolver): Promise<DeepPartial<Entity>>;
}

/**
 * Data definition.
 * A data definition is either a simple DeepPartial as used by typeorm itself, or an async function resulting in the same.
 */
export type Data<Entity = any> = DeepPartial<Entity> | AsyncData<Entity>;

/**
 * Defines a resolver function.
 * The resolver function is used by async data definitions to resolve reference to other entities being created by builders.
 * This allows the insertion of relations.
 */
export interface Resolver {
  <Entity>(type: new () => Entity, name: string, builderName?: string): Promise<
    Entity
  >;
}

/**
 * User defined pre resolver.
 * Gets the data of a fixture before it's persisted. If the resolved to an entity, it is used
 * instead.
 */
export interface PreResolver<Entity = any> {
  (
    data: DeepPartial<Entity>,
    repository: Repository<Entity>,
    resolve: Resolver,
  ): Promise<Entity | undefined>;
}

/**
 * Checks whenever the given data is an async data definition or not.
 *
 * @param data Data definition.
 */
function isAsyncData(data: DeepPartial<any> | AsyncData): data is AsyncData {
  return typeof data === 'function';
}

/**
 * Builder.
 */
export class Builder {
  private readonly data = new Map<string, [any, Data]>();
  private readonly entities = new Map<string, any>();
  private readonly builders = new Map<string, Builder>();
  private readonly resolvers = new Map<new () => any, PreResolver>();

  /**
   * Includes a foreign builder.
   * Foreign builders run before the current builder and allows it to reference entities created from those.
   *
   * @param name Name for the builder reference, used by async data definitions.
   * @param builder Builder.
   */
  include(name: string, builder: Builder) {
    this.builders.set(name, builder);

    return this;
  }

  /**
   * Adds a custom resolver for the given entity type.
   * Whenever a fixture is about to be persisted, the resolver is called first.
   *
   * @param type Entity type.
   * @param resolver Resolver.
   */
  resolve<Entity>(type: new () => Entity, resolver: PreResolver<Entity>) {
    this.resolvers.set(type, resolver);

    return this;
  }

  /**
   * Pushes an entity definition to create.
   *
   * @param name Name for the entity reference, used by async data definitions.
   * @param type Entity type (Class)
   * @param data Entity data
   */
  fixture<Entity, Name extends string>(
    type: new () => Entity,
    name: Name,
    data: Data<Entity>,
  ) {
    if (this.data.has(name)) {
      throw new Error(`Cannot push data since name is already taken: ${name}`);
    }

    this.data.set(name, [type, data]);

    return this;
  }

  /**
   * Creates the actual entities in the database using the given entity manager.
   *
   * @throws When the expected entity type and the actual known type do not match.
   * @throws When the builder reference is unknown.
   * @throws When the entity reference is unknown.
   * @throws On typeorm specific errors.
   *
   * @param manager Entity manager.
   */
  async install(manager: EntityManager) {
    for (const builder of Array.from(this.builders.values())) {
      await builder.install(manager);
    }

    await manager.transaction(async innerManager => {
      for (const [name, [type, data]] of Array.from(this.data)) {
        await this.build(innerManager, name, type, data);
      }

      this.entities.clear();
    });
  }

  /**
   * Runs an entity creation operation and returns the created entity.
   *
   * @param manager Entity manager
   * @param name Name of the entity reference.
   * @param type Entity type.
   * @param data Entity data.
   */
  private async build<Entity>(
    manager: EntityManager,
    name: string,
    type: new () => Entity,
    data: Data<Entity>,
  ): Promise<Entity> {
    if (this.entities.has(name) === false) {
      const repository = manager.getRepository(type);
      const resolver = this.getResolver(manager);
      const resolved = isAsyncData(data) ? await data(resolver) : data;
      const find = this.resolvers.get(type);
      const found =
        find && (await find(resolved, manager.getRepository(type), resolver));
      this.entities.set(
        name,
        found
          ? repository.merge(found, resolved)
          : await repository.save(repository.create(resolved), {
              transaction: false,
            }),
      );
    }

    return this.entities.get(name) as Entity;
  }

  /**
   * Gets a builder for the given builder name.
   *
   * @throws When the builder reference is unknown.
   *
   * @param name Name of the builder reference.
   */
  private getBuilder(name?: string) {
    const builder = name === undefined ? this : this.builders.get(name);

    if (builder === undefined) {
      throw new Error(`Unable to find builder reference for name "${name}"`);
    }

    return builder;
  }

  /**
   * Retrieves the data for an entity to created based upon the target builder, type and name for the entity.
   *
   * @throws When the expected entity type and the actual known type do not match.
   * @throws When the builder reference is unknown.
   * @throws When the entity reference is unknown.
   *
   * @param type Entity name.
   * @param name Name of the entity reference.
   * @param builderName Name of the builder reference.
   */
  private getData<Entity>(
    type: new () => Entity,
    name: string,
    builderName?: string,
  ): Data<Entity> {
    const builder = this.getBuilder(builderName);
    const typeAndData = builder.data.get(name);

    if (typeAndData === undefined) {
      throw new Error(
        `Unable to find fixture reference for name "${name}" ${
          builderName ? `in builder "${builderName}"` : ''
        }`,
      );
    }

    const [actualType, data] = typeAndData;

    if (type !== actualType) {
      throw new Error(
        `Type mismatch for reference "${name}": Expected "${type.name}" but found "${actualType.name}"`,
      );
    }

    return data;
  }

  /**
   * Creates a resolver function for async data definitions, based upon the given entity manager.
   *
   * @param manager Entity manager.
   */
  private getResolver(manager: EntityManager): Resolver {
    return async <Entity>(
      type: new () => Entity,
      name: string,
      builderName?: string,
    ): Promise<Entity> => {
      return this.getBuilder(builderName).build<Entity>(
        manager,
        name,
        type,
        this.getData(type, name, builderName),
      );
    };
  }
}

/**
 * Creates a new fixture builder.
 */
export const builder = () => new Builder();
