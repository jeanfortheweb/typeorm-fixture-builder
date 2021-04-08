/* eslint-disable @typescript-eslint/no-explicit-any */
import { Connection } from 'typeorm';
import { persist } from './persist';
import { isPersisted } from './reflect';

/**
 * Called after each pesist call to inform about the installation progress.
 */
export interface InstallCallback<Entity> {
  (fixture: Entity, skipped: boolean): void;
}

const defaultCallback: InstallCallback<any> = () => {
  // noop
};

/**
 * Uses the given connection to install an array of fixtures.
 * Fixtures have to be defined by using the `fixture` function.
 *
 * @see fixture
 * @param connection Connection.
 * @param fixtures Array of fixtures.
 * @param callback Called after each installed fixture
 */
export async function install<Entity>(
  connection: Connection,
  fixtures: Entity[],
  callback: InstallCallback<Entity> = defaultCallback,
): Promise<void> {
  await connection.transaction(async manager => {
    for (const fixture of fixtures) {
      if (isPersisted(fixture) === false) {
        callback(await persist(manager, fixture), false);
      } else {
        callback(fixture, true);
      }
    }
  });
}
