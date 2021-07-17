#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */

import program from 'commander';
import 'ts-node/register';
import 'tsconfig-paths/register';
import { execute } from './cli/executor';

/**
 * Defines the options of the "install" command.
 */
interface InstallCommand {
  connection?: string;
  resetDatabase: boolean;
  useMigrations: boolean;
  silent: boolean;
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
  execute({ ...options, pattern });
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
    '-c, --connection <name>',
    'Name of connection to use. Check the typeorm documentation for further information. [default: "default"]',
    'default',
  )
  .option(
    '-m, --use-migrations',
    'Execute migrations instead synchronization after dropping the database',
  )
  .option('-s, --silent', 'Installs fixtures silently, only shows errors')
  .action(action);

program.parse(process.argv);
