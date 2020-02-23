#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */

import 'ts-node/register';
import program from 'commander';
import { sync } from 'glob';
import { relative } from 'path';
import { createConnection, Connection, ConnectionOptionsReader } from 'typeorm';
import ora, { Ora } from 'ora';
import { collect } from './collect';
import { install } from './install';

/**
 * Defines the options of the "install" command.
 */
interface InstallCommand {
  connection?: string;
  resetDatabase: boolean;
  useMigrations: boolean;
}

/**
 * Collects the paths and fixtures from bundle files using the given pattern.
 *
 * @param spinner Spinner.
 * @param pattern Pattern.
 */
function collectBundles(spinner: Ora, pattern: string): [string, any[]][] {
  spinner.start('Collecting fixtures from bundles');

  const bundles = sync(pattern, {
    cwd: process.cwd(),
    absolute: true,
  }).map<[string, any[]]>(file => {
    try {
      return [relative(process.cwd(), file), collect(require(file))];
    } catch (error) {
      spinner.fail(
        `Failed to load bundle file at: ${relative(process.cwd(), file)}: ${
          error.message
        }`,
      );

      return process.exit(1);
    }
  });

  const count = bundles.reduce(
    (count, fixtures) => (count += fixtures.length),
    0,
  );

  spinner.succeed(
    `Found ${bundles.length} fixture bundles with a total of ${count} fixtures`,
  );

  return bundles;
}

/**
 * Creates a database connection using a connection name.
 *
 * @param spinner Spinner.
 * @param connectionName Connection name.
 */
async function getConnection(
  spinner: Ora,
  connectionName: string,
): Promise<Connection> {
  let connection: Connection;

  try {
    spinner.start('Connecting to database');

    try {
      connection = await createConnection(
        await new ConnectionOptionsReader({
          root: process.cwd(),
        }).get(connectionName),
      );
    } catch (error) {
      connection = await createConnection(connectionName);
    }
  } catch (error) {
    spinner.fail(`Failed to get database connection: ${error.message}`);

    return process.exit(1);
  }

  spinner.succeed('Connected');

  return connection;
}

/**
 * Resets the database.
 *
 * @param spinner Spinner.
 * @param connection Connection.
 * @param useMigrations Use migrations.
 */
async function reset(
  spinner: ora.Ora,
  connection: Connection,
  useMigrations: boolean,
): Promise<void> {
  try {
    await connection.dropDatabase();

    if (useMigrations === true) {
      spinner.start('Migrating database');

      await connection.runMigrations();
    } else {
      spinner.start('Synchronizing database');

      await connection.synchronize();
    }
  } catch (error) {
    spinner.fail(`Failed to reset database: ${error.message}`);

    return process.exit(1);
  }

  spinner.succeed('Database reset complete');
}

/**
 * Installs a list of bundles.
 *
 * @param spinner Spinner.
 * @param connection Connection.
 * @param bundles Bundles to install.
 */
async function installBundles(
  spinner: ora.Ora,
  connection: Connection,
  bundles: [string, any[]][],
): Promise<void> {
  for (const [path, fixtures] of bundles) {
    spinner.start(path);

    await install(connection, fixtures);

    spinner.succeed(path);
  }
}

/**
 * "install" command action.
 *
 * @param pattern
 * @param options
 */
async function action(
  pattern = './fixtures/**/*.bundle.ts',
  options: InstallCommand,
): Promise<void> {
  const {
    connection: connectionName = 'default',
    resetDatabase,
    useMigrations,
  } = options;

  const spinner = ora('');
  const bundles = collectBundles(spinner, pattern);
  const connection = await getConnection(spinner, connectionName);

  if (resetDatabase === true) {
    await reset(spinner, connection, useMigrations);
  }

  await installBundles(spinner, connection, bundles);

  spinner.succeed('Done');
  process.exit(0);
}

program
  .command('install [pattern]')
  .description(
    'Load fixtures into database. Pattern is optional and can be a glob pattern. [default: "fixtures/**/*.bundle.ts"',
  )
  .option(
    '-r, --reset-database',
    'Drops and synchronizes the database before loading fixtures',
  )
  .option(
    '-c, --connection',
    'Name of connection to use. Check the typeorm documentation for further information. [default: "default"]',
    'default',
  )
  .option(
    '-m, --use-migrations',
    'Execute migrations instead synchronization after dropping the database',
  )
  .action(action);

program.parse(process.argv);
