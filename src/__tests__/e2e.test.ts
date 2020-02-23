import { createConnection, Connection } from "typeorm";
import { Group } from "./entities/group";
import { User } from "./entities/user";
import { install } from "../install";
import { collect } from "../collect";
import { Profile } from "./entities/profile";
import { isPersisted } from "../reflect";
import { fixture } from "../fixture";
import { Picture } from "./entities/picture";
import { dirname, resolve } from "path";
import { exec } from "child_process";

let connection: Connection;
const database = resolve(__dirname, "..", "..", "test.db");

beforeEach(async () => {
  connection = await createConnection({
    type: "sqlite",
    database,
    entities: [Group, User, Profile, Picture],
    dropSchema: true,
    synchronize: true
  });
});

afterEach(async () => {
  if (connection && connection.isConnected) {
    await connection.close();
  }
});

describe("install", () => {
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
});

describe("cli", () => {
  const executable = resolve(__dirname, "..", "..", "bin", "./cli.js");

  beforeAll(done => {
    exec("yarn compile:test", { cwd: dirname(dirname(__dirname)) }, () =>
      done()
    );
  }, 20000);

  it("should fail with unknown options", async () => {
    expect((await run(".", ["-p", "parameter"])).code).toEqual(1);
  });

  it("should display correct help texts", async () => {
    expect((await run(".", ["--help"])).stdout).toMatchSnapshot();
    expect((await run(".", ["install", "--help"])).stdout).toMatchSnapshot();
  });

  it("should successfully install a bundle", async () => {
    const scenario = resolve(__dirname, "./scenarios/simple/simple.bundle.ts");
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

    const { code, stderr } = await run(".", ["install", "-r", scenario]);

    expect(code).toEqual(0);
    expect(stderr).toMatchSnapshot();

    for (const [group, fixtures] of Object.entries(fixturesByType)) {
      expect(await connection.getRepository(group).count()).toEqual(
        fixtures.length
      );
    }

    await connection.close();
  }, 20000);

  it("should fail on an invalid bundle", async () => {
    const scenario = resolve(
      __dirname,
      "./scenarios/invalid/invalid.bundle.ts"
    );
    const { code, stderr } = await run(".", ["install", "-r", scenario]);

    expect(code).toEqual(1);
    expect(stderr).toMatchSnapshot();
  }, 20000);

  interface Result {
    code?: number;
    error: Error | null;
    stdout: string;
    stderr: string;
  }

  function run(cwd: string, args: string[]): Promise<Result> {
    return new Promise(resolve => {
      exec(
        `node ${executable} ${args.join(" ")}`,
        { cwd },
        (error, stdout, stderr) => {
          resolve({
            code: error && error.code ? error.code : 0,
            error,
            stdout,
            stderr
          });
        }
      );
    });
  }
});
