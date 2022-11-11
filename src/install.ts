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
 * Uses the given data source to install an array of fixtures.
 * Fixtures have to be defined by using the `fixture` function.
 *
 * @see fixture
 * @param dataSource Data source.
 * @param fixtures Array of fixtures.
 * @param callback Called after each installed fixture
 */
export async function install<Entity extends ObjectLiteral>(
  dataSource: DataSource,
  fixtures: Entity[],
  callback: InstallCallback<Entity> = defaultCallback,
): Promise<void> {
  if (!dataSource.isInitialized) {
    await dataSource.initialize()
  }
  await dataSource.transaction(async manager => {
    for (const fixture of fixtures) {
      callback(fixture, await persist(manager, fixture));
    }
  });
}
