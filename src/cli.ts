#!/usr/bin/env node
import "ts-node/register";
import program, { Command } from "commander";
import { sync } from "glob";
import { Builder } from "./builder";
import { relative } from "path";
import { createConnection, Connection, ConnectionOptionsReader } from "typeorm";
import ora from "ora";

program
  .command("install [pattern]")
  .description(
    'Load fixtures into database. Pattern is optional and can be a glob pattern. [default: "fixtures/**/*.fixture.ts"['
  )

  .option(
    "-r, --reset-database",
    "Drops and synchronizes the database before loading fixtures"
  )
  .option(
    "-c, --connection <name>",
    'Name of connection to use. Check the typeorm documentation for further information. [default: "default"]'
  )
  .option(
    "-m, --use-migrations",
    "Execute migrations instead synchronization after dropping the database"
  )
  .action(
    async (
      pattern: string = "./fixtures/**/*.fixture.ts",
      {
        connection,
        resetDatabase,
        useMigrations
      }: Command
    ) => {
      const spinner = ora("");

      spinner.start("Gathering fixture builders");
      console.log("IN HERE???")
      console.log(connection);
      console.log(program.connection);
      console.log(program.connectionName);
      const builders = sync(pattern, {
        cwd: process.cwd(),
        absolute: true
      }).map<[string, Builder]>(file => {
        try {
          const builder = require(file).default;

          if (builder === undefined || typeof builder.build !== "function") {
            throw new Error("Expected builder instance as default export");
          }

          return [relative(process.cwd(), file), builder];
        } catch (error) {
          spinner.fail(
            `Failed to load fixture file at: ${relative(
              process.cwd(),
              file
            )}: ${error.message}`
          );

          return process.exit(1);
        }
      });

      spinner.succeed(`Found ${builders.length} fixture builders`);

      let conn: Connection;

      try {
        spinner.start("Connecting to database");

        try {
          conn = await createConnection(
            await new ConnectionOptionsReader({
              root: process.cwd()
            }).get(connection)
          );
        } catch (error) {
          console.log(error);
          conn = await createConnection(connection);
        }
      } catch (error) {
        spinner.fail(`Failed to get database connection: ${error.message}`);

        return process.exit(1);
      }

      spinner.succeed("Connected");

      if (resetDatabase === true) {
        try {
          if (useMigrations === true) {
            spinner.start("Dropping and migrating database");

            await conn.dropDatabase();
            await conn.runMigrations();
          } else {
            spinner.start("Dropping and synchronizing database");

            await conn.dropDatabase();
            await conn.synchronize();
          }
        } catch (error) {
          spinner.fail(`Failed to reset database: ${error.message}`);

          return process.exit(1);
        }

        spinner.succeed("Database reset complete");
      }

      for (const [path, builder] of builders) {
        spinner.start(path);

        await builder.install(conn.manager);

        spinner.succeed(path);
      }

      spinner.succeed("Done");
      process.exit(0);
    }
  );

program.parse(process.argv);
