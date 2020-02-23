/* eslint-disable @typescript-eslint/no-explicit-any */
import { Connection } from 'typeorm';
import { persist } from './persist';

export async function install(
  connection: Connection,
  fixtures: any[],
): Promise<void> {
  await connection.transaction(async manager => {
    for (const fixture of fixtures) {
      await persist(manager, fixture);
    }
  });
}
