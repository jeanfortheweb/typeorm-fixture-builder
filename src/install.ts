import { Connection } from "typeorm";
import { persist } from "./persist";

export async function install(connection: Connection, fixtures: any[]) {
  for (const fixture of fixtures) {
    await persist(connection, fixture);
  }
}
