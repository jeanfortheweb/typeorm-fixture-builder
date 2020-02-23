import { createConnection, Connection } from "typeorm";
import { Group } from "./entities/group";
import { User } from "./entities/user";
import { install } from "../install";
import { collect } from "../collect";
import { Profile } from "./entities/profile";
import { isPersisted } from "../reflect";
import { fixture } from "../fixture";
import { Picture } from "./entities/picture";

let connection: Connection;

beforeAll(async () => {
  connection = await createConnection({
    type: "sqlite",
    database: "./test.db",
    entities: [Group, User, Profile, Picture],
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
        expect(isPersisted(fixture)).toEqual(true);
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

describe("resolve", () => {
  it("should use and merge resolved entity", async () => {
    const resolver = jest.fn((repository, { firstName }) =>
      repository
        .createQueryBuilder("user")
        .where("user.firstName = :firstName", { firstName })
    );

    const user1 = fixture(
      User,
      { firstName: "Foo", lastName: "Bar" },
      resolver
    );
    const user2 = fixture(
      User,
      { firstName: "Foo", lastName: "Baz" },
      resolver
    );

    await install(connection, [user1, user2]);

    expect(resolver).toHaveBeenCalledTimes(2);
    expect(await connection.getRepository(User).count()).toEqual(1);
    expect(await connection.getRepository(User).findOne()).toEqual({
      id: 1,
      firstName: "Foo",
      lastName: "Baz"
    });
  });

  it("should use fixture when no entity is resolved", async () => {
    const resolver = jest.fn(repository =>
      repository
        .createQueryBuilder("user")
        .where("user.firstName = :firstName", { firstName: "Baz" })
    );

    const user1 = fixture(
      User,
      { firstName: "Foo", lastName: "Bar" },
      resolver
    );

    const user2 = fixture(
      User,
      { firstName: "Foo", lastName: "Baz" },
      resolver
    );

    await install(connection, [user1, user2]);

    expect(resolver).toHaveBeenCalledTimes(2);
    expect(await connection.getRepository(User).count()).toEqual(2);
    expect(await connection.getRepository(User).find()).toEqual([
      {
        id: 1,
        firstName: "Foo",
        lastName: "Bar"
      },
      {
        id: 2,
        firstName: "Foo",
        lastName: "Baz"
      }
    ]);
  });
});
