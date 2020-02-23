import { Connection } from "typeorm";
import { Fixture } from "./fixture";

export async function install(connection: Connection, fixtures: Fixture[]) {
  for (const fixture of fixtures) {
    await persist(connection, fixture);
  }
}

async function persist(connection: Connection, fixture: any) {
  if (fixture.__persisted === false) {
    const { relations } = connection.getMetadata(fixture.constructor);

    for (const { propertyName } of relations) {
      const value = fixture[propertyName];

      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          for (const index in value) {
            value[index] = await persist(connection, value[index]);
          }
        } else {
          fixture[propertyName] = await persist(
            connection,
            fixture[propertyName]
          );
        }
      }
    }

    const persisted = await connection
      .getRepository(fixture.constructor)
      .save(fixture);

    for (const property of Object.getOwnPropertyNames(fixture)) {
      fixture[property] = persisted[property];
    }

    fixture.__persisted = true;
  }

  return fixture;
}
