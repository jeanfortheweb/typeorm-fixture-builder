import { Task } from './task';

/**
 * Resets the database when reset flag is present.
 *
 * @param args
 */
export const reset: Task = async args => {
  const { setStatus, pushInfo, context, options } = args;
  const { resetDatabase, useMigrations } = options;
  const { connection } = context;

  if (resetDatabase !== true) {
    return pushInfo({ text: 'ℹ Database reset skipped', color: 'blue' });
  }

  setStatus(
    `Resetting database ${
      useMigrations ? 'using migrations' : 'using synchronize'
    }`,
  );

  await connection.dropDatabase();

  if (useMigrations === true) {
    await connection.runMigrations();
  } else {
    await connection.synchronize();
  }

  pushInfo({ text: '✔ Database reset complete', color: 'green' });
};
