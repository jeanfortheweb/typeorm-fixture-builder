#!/usr/bin/env node
import "ts-node/register";
import program, { Command } from "commander";
import { sync } from "glob";
import { relative } from "path";
import { createConnection, Connection, ConnectionOptionsReader } from "typeorm";
import ora from "ora";
import { collect } from "./collect";
import { install } from "./install";

program
  .command("install [pattern]")
  .description(
    'Load fixtures into database. Pattern is optional and can be a glob pattern. [default: "fixtures/**/*.bundle.ts"'
  )
  .option(
    "-r, --reset-database",
    "Drops and synchronizes the database before loading fixtures"
  )
  .option(
    "-c, --connection",
    'Name of connection to use. Check the typeorm documentation for further information. [default: "default"]',
    "default"
  )
  .option(
    "-m, --use-migrations",
    "Execute migrations instead synchronization after dropping the database"
  )
  .action(
    async (
      pattern: string = "./fixtures/**/*.bundle.ts",
      {
        connection: connectionName = "default",
        resetDatabase,
        useMigrations
      }: Command
    ) => {
      const spinner = ora("");

      spinner.start("Collecting fixtures from bundles");

      const bundles = sync(pattern, {
        cwd: process.cwd(),
        absolute: true
      }).map<[string, any[]]>(file => {
        try {
          return [relative(process.cwd(), file), collect(require(file))];
        } catch (error) {
          spinner.fail(
            `Failed to load bundle file at: ${relative(process.cwd(), file)}: ${
              error.message
            }`
          );

          return process.exit(1);
        }
      });

      const count = bundles.reduce(
        (count, fixtures) => (count += fixtures.length),
        0
      );

      spinner.succeed(
        `Found ${bundles.length} fixture bundles with a total of ${count} fixtures`
      );

      let connection: Connection;

      try {
        spinner.start("Connecting to database");

        try {
          connection = await createConnection(
            await new ConnectionOptionsReader({
              root: process.cwd()
            }).get(connectionName)
          );
        } catch (error) {
          connection = await createConnection(connectionName);
        }
      } catch (error) {
        spinner.fail(`Failed to get database connection: ${error.message}`);

        return process.exit(1);
      }

      spinner.succeed("Connected");

      if (resetDatabase === true) {
        try {
          await connection.dropDatabase();

          if (useMigrations === true) {
            spinner.start("Migrating database");

            await connection.runMigrations();
          } else {
            spinner.start("Synchronizing database");

            await connection.synchronize();
          }
        } catch (error) {
          spinner.fail(`Failed to reset database: ${error.message}`);

          return process.exit(1);
        }

        spinner.succeed("Database reset complete");
      }

      for (const [path, fixtures] of bundles) {
        spinner.start(path);

        await install(connection, fixtures);

        spinner.succeed(path);
      }

      spinner.succeed("Done");
      process.exit(0);
    }
  );

program.parse(process.argv);
