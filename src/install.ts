/* eslint-disable @typescript-eslint/no-explicit-any */
import { Connection } from 'typeorm';
import { persist } from './persist';

/**
 * Uses the given connection to install an array of fixtures.
 * Fixtures have to be defined by using the `fixture` function.
 *
 * @see fixture
 * @param connection Connection.
 * @param fixtures Array of fixtures.
 */
export async function install<Entity>(
  connection: Connection,
  fixtures: Entity[],
): Promise<void> {
  await connection.transaction(async manager => {
    for (const fixture of fixtures) {
      await persist(manager, fixture);
    }
  });
}
