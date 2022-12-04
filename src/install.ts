/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataSource, ObjectLiteral } from 'typeorm';
import { persist } from './persist';

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
 * Uses the given DataSource to install an array of fixtures.
 * Fixtures have to be defined by using the `fixture` function.
 *
 * @see fixture
 * @param source DataSource.
 * @param fixtures Array of fixtures.
 * @param callback Called after each installed fixture
 */
export async function install<Entity extends ObjectLiteral>(
  source: DataSource,
  fixtures: Entity[],
  callback: InstallCallback<Entity> = defaultCallback,
): Promise<void> {
  await source.transaction(async manager => {
    for (const fixture of fixtures) {
      callback(fixture, await persist(manager, fixture));
    }
  });
}
