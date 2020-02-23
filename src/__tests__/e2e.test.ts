import { createConnection, Connection } from "typeorm";
import { Group } from "./entities/group";
import { User } from "./entities/user";
import { install } from "../install";
import { collect } from "../collect";
import { Profile } from "./entities/profile";

let connection: Connection;

beforeAll(async () => {
  connection = await createConnection({
    type: "sqlite",
    database: "./test.db",
    entities: [Group, User, Profile],
    synchronize: true
  });
});

beforeEach(async () => {
  await connection.dropDatabase();
  await connection.synchronize();
});

describe("scenarios", () => {
  it.each`
    scenario
    ${"./scenarios/simple/simple.bundle.ts"}
    ${"./scenarios/complex/complex.bundle.ts"}
    ${"./scenarios/imports/imports.bundle.ts"}
  `("should successfully complete scenario $scenario", async ({ scenario }) => {
    const fixtures = collect(require(scenario)) as any[];
    const fixturesByType = fixtures.reduce<{ [key: string]: any[] }>(
      (grouped, fixture) => ({
        ...grouped,
        [fixture.constructor.name]: [
          ...(grouped[fixture.constructor.name] || []),
          fixture
        ]
      }),
      {}
    );

    await install(connection, fixtures);

    for (const [group, fixtures] of Object.entries(fixturesByType)) {
      for (const fixture of fixtures) {
        expect(fixture.id).toBeDefined();
        expect(fixture.__persisted).toEqual(true);
      }

      expect(await connection.getRepository(group).count()).toEqual(
        fixtures.length
      );
    }
  });

  it("should fail on invalid bundle", () => {
    expect(() =>
      collect(require("./scenarios/invalid/invalid.bundle"))
    ).toThrow("Invalid fixture definition.");
  });
});
