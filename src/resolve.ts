/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DeepPartial,
  SelectQueryBuilder,
  Repository,
  Connection
} from 'typeorm';
import { getResolver } from './reflect';

export interface Resolver<Entity extends {} = any> {
  (
    repository: Repository<Entity>,
    values: DeepPartial<Entity>
  ): SelectQueryBuilder<Entity>;
}

export async function resolve(
  connection: Connection,
  fixture: any
): Promise<any> {
  const repository = connection.getRepository(fixture.constructor);
  const resolver = getResolver(fixture);

  if (resolver !== undefined) {
    const resolved = await resolver(repository, fixture).getOne();

    if (resolved !== undefined) {
      fixture = repository.merge(resolved, fixture);
    }
  }

  return fixture;
}
