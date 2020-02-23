/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Connection } from 'typeorm';
import { isPersisted, setPersisted } from './reflect';
import { resolve } from './resolve';

/**
 * Persists an array relation (many-to-many, one-to-many)
 *
 * @param connection TypeORM connection.
 * @param fixture Fixture.
 * @param propertyName Property.
 */
async function persistManyRelation(
  connection: Connection,
  fixture: any,
  propertyName: string
): Promise<void> {
  for (const index in fixture[propertyName] || []) {
    fixture[propertyName][index] = await persist(
      connection,
      fixture[propertyName][index]
    );
  }
}

/**
 * Persists a non array relation (one-to-one, many-to-one).
 *
 * @param connection TypeORM connection.
 * @param fixture Fixture.
 * @param propertyName Property.
 */
async function persistOneRelation(
  connection: Connection,
  fixture: any,
  propertyName: string
): Promise<void> {
  if (fixture[propertyName]) {
    fixture[propertyName] = await persist(connection, fixture[propertyName]);
  }
}

/**
 * Persists the relations of a fixture.
 *
 * @param connection TypeORM connection.
 * @param fixture Fixture.
 */
async function persistRelations(
  connection: Connection,
  fixture: any
): Promise<void> {
  const { relations } = connection.getMetadata(fixture.constructor);

  for (const { propertyName, relationType } of relations) {
    switch (relationType) {
      case 'many-to-many':
      case 'one-to-many':
        await persistManyRelation(connection, fixture, propertyName);
        break;

      case 'many-to-one':
      case 'one-to-one':
        await persistOneRelation(connection, fixture, propertyName);
        break;
    }
  }
}

/**
 * Persists the fixture itself.
 *
 * @param connection TypeORM connection.
 * @param fixture Fixture.
 */
async function persistEntity(
  connection: Connection,
  fixture: any
): Promise<void> {
  return connection
    .getRepository(fixture.constructor)
    .save(await resolve(connection, fixture));
}

/**
 * Persists a fixture.
 *
 * @param connection TypeORM connection.
 * @param fixture Fixture.
 */
export async function persist(
  connection: Connection,
  fixture: any
): Promise<any> {
  if (isPersisted(fixture) === false) {
    await persistRelations(connection, fixture);
    await persistEntity(connection, fixture);

    setPersisted(fixture, true);
  }

  return fixture;
}
