/* eslint-disable @typescript-eslint/no-explicit-any */
import { createConnection, Connection } from 'typeorm';
import { Group } from './entities/group';
import { User } from './entities/user';
import { install } from '../install';
import { collect } from '../collect';
import { Profile } from './entities/profile';
import { isPersisted } from '../reflect';
import { fixture } from '../fixture';
import { Picture } from './entities/picture';
import { dirname, resolve } from 'path';
import { exec } from 'child_process';

interface Result {
  code?: number;
  error: Error | null;
  stdout: string;
  stderr: string;
}

const executable = resolve(__dirname, '..', '..', 'bin', './cli.js');

function run(cwd: string, args: string[]): Promise<Result> {
  return new Promise(resolve => {
    exec(
      `node ${executable} ${args.join(' ')}`,
      { cwd },
      (error, stdout, stderr) => {
        resolve({
          code: error && error.code ? error.code : 0,
          error,
          stdout,
          stderr,
        });
      },
    );
  });
}

let connection: Connection;
const database = resolve(__dirname, '..', '..', 'test.db');

beforeEach(async () => {
  connection = await createConnection({
    type: 'sqlite',
    database,
    entities: [Group, User, Profile, Picture],
    dropSchema: true,
    synchronize: true,
  });
});

afterEach(async () => {
  if (connection && connection.isConnected) {
    await connection.close();
  }
});

describe('install', () => {
  it.each`
    scenario
    ${'./scenarios/simple/simple.bundle.ts'}
    ${'./scenarios/complex/complex.bundle.ts'}
    ${'./scenarios/imports/imports.bundle.ts'}
  `('should successfully complete scenario $scenario', async ({ scenario }) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fixtures = collect(require(scenario)) as any[];
    const fixturesByType = fixtures.reduce<{ [key: string]: any[] }>(
      (grouped, fixture) => ({
        ...grouped,
        [fixture.constructor.name]: [
          ...(grouped[fixture.constructor.name] || []),
          fixture,
        ],
      }),
      {},
    );

    await install(connection, fixtures);

    for (const [group, fixtures] of Object.entries(fixturesByType)) {
      for (const fixture of fixtures) {
        expect(fixture.id).toBeDefined();
        expect(isPersisted(fixture)).toEqual(true);
      }

      expect(await connection.getRepository(group).count()).toEqual(
        fixtures.length,
      );
    }
  });

  it('should fail on invalid bundle', () => {
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      collect(require('./scenarios/invalid/invalid.bundle')),
    ).toThrow('Invalid fixture definition.');
  });

  it('should accept an install callback', async () => {
    const fixtures = collect(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('./scenarios/simple/simple.bundle'),
    ) as any[];

    const callback = jest.fn();

    await install(connection, fixtures, callback);

    expect(callback).toHaveBeenCalledTimes(fixtures.length);
  });

  describe('resolve', () => {
    it('should use and merge resolved entity', async () => {
      const resolver = jest.fn((repository, { firstName }) =>
        repository
          .createQueryBuilder('user')
          .where('user.firstName = :firstName', { firstName }),
      );

      const user1 = fixture(
        User,
        { firstName: 'Foo', lastName: 'Bar' },
        resolver,
      );
      const user2 = fixture(
        User,
        { firstName: 'Foo', lastName: 'Baz' },
        resolver,
      );

      await install(connection, [user1, user2]);

      expect(resolver).toHaveBeenCalledTimes(2);
      expect(await connection.getRepository(User).count()).toEqual(1);
      expect(await connection.getRepository(User).findOne()).toEqual({
        id: 1,
        firstName: 'Foo',
        lastName: 'Baz',
      });
    });

    it('should use fixture when no entity is resolved', async () => {
      const resolver = jest.fn(repository =>
        repository
          .createQueryBuilder('user')
          .where('user.firstName = :firstName', { firstName: 'Baz' }),
      );

      const user1 = fixture(
        User,
        { firstName: 'Foo', lastName: 'Bar' },
        resolver,
      );

      const user2 = fixture(
        User,
        { firstName: 'Foo', lastName: 'Baz' },
        resolver,
      );

      await install(connection, [user1, user2]);

      expect(resolver).toHaveBeenCalledTimes(2);
      expect(await connection.getRepository(User).count()).toEqual(2);
      expect(await connection.getRepository(User).find()).toEqual([
        {
          id: 1,
          firstName: 'Foo',
          lastName: 'Bar',
        },
        {
          id: 2,
          firstName: 'Foo',
          lastName: 'Baz',
        },
      ]);
    });
  });
});

describe('cli', () => {
  beforeAll(done => {
    exec('yarn compile:test', { cwd: dirname(dirname(__dirname)) }, () =>
      done(),
    );
  }, 20000);

  it('should fail with unknown options', async () => {
    expect((await run('.', ['-p', 'parameter'])).code).toEqual(1);
  });

  describe('with simple bundle setup', () => {
    let scenario: string;
    let fixtures;
    let fixturesByType: Record<string, Record<string, any>>;

    beforeEach(() => {
      scenario = resolve(__dirname, './scenarios/simple/simple.bundle.ts');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      fixtures = collect(require(scenario)) as any[];
      fixturesByType = fixtures.reduce<{ [key: string]: any[] }>(
        (grouped, fixture) => ({
          ...grouped,
          [fixture.constructor.name]: [
            ...(grouped[fixture.constructor.name] || []),
            fixture,
          ],
        }),
        {},
      );
    });

    it('should successfully install a bundle', async () => {
      const { code } = await run('.', ['install', '-r', scenario]);

      expect(code).toEqual(0);

      for (const [group, fixtures] of Object.entries(fixturesByType)) {
        expect(await connection.getRepository(group).count()).toEqual(
          fixtures.length,
        );
      }
    }, 20000);

    it('should successfully install when using the connection arg', async () => {
      const { code } = await run('.', ['install', '-c', 'default', scenario]);

      expect(code).toEqual(0);

      for (const [group, fixtures] of Object.entries(fixturesByType)) {
        expect(await connection.getRepository(group).count()).toEqual(
          fixtures.length,
        );
      }
    }, 20000);

    it('should fail when using a bad connection', async () => {
      const { code } = await run('.', ['install', '-c', 'wrong', scenario]);

      expect(code).toEqual(1);
    }, 20000);

    it('should not generate console output with --silent option', async () => {
      const { code, stdout } = await run('.', [
        'install',
        '-r',
        '-s',
        scenario,
      ]);

      expect(code).toEqual(0);
      expect(stdout.trim().length).toEqual(0);
    }, 20000);

    it('should generate console output without --silent option', async () => {
      const { code, stdout } = await run('.', ['install', '-r', scenario]);

      expect(code).toEqual(0);
      expect(stdout.trim().length).toBeGreaterThan(0);
    }, 20000);
  });

  it('should fail on an invalid bundle', async () => {
    const scenario = resolve(
      __dirname,
      './scenarios/invalid/invalid.bundle.ts',
    );
    const { code } = await run('.', ['install', '-r', scenario]);

    expect(code).toEqual(1);
  }, 20000);

  it('should generate console output with --silent option when errors present', async () => {
    const scenario = resolve(
      __dirname,
      './scenarios/invalid/invalid.bundle.ts',
    );

    const { code, stdout } = await run('.', ['install', '-r', '-s', scenario]);

    expect(code).toEqual(1);
    expect(stdout.trim().length).toBeGreaterThan(0);
  }, 20000);
});
