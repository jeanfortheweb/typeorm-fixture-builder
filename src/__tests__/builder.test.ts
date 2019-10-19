import { builder } from '../builder';
import { createConnection, Connection } from 'typeorm';
import { Group } from './entities/group';
import { User } from './entities/user';

let connection: Connection;

beforeAll(async () => {
  connection = await createConnection({
    type: 'sqlite',
    database: './test.db',
    entities: [Group, User],
    synchronize: true,
  });
});

beforeEach(async () => {
  await connection.dropDatabase();
  await connection.synchronize();
});

it('should create the expected entities without a foreign builder', async () => {
  const usersBuilder = builder();

  usersBuilder
    .resolve(User, async ({ firstName, lastName }, repository) =>
      repository.findOne({
        where: {
          firstName,
          lastName,
        },
      }),
    )
    .fixture(Group, 'administrators', {
      name: 'Administrators',
    })
    .fixture(User, 'myuser', async get => ({
      firstName: 'John',
      lastName: 'Doe',
      groups: [await get(Group, 'administrators')],
    }));

  await usersBuilder.install(connection.manager);

  const groups = await connection.getRepository(Group).find();
  const users = await connection
    .getRepository(User)
    .find({ relations: ['groups'] });

  expect(groups).toMatchSnapshot('groups');
  expect(users).toMatchSnapshot('users');
});

it('should create the expected entities with foreign builder', async () => {
  const groupsBuilder = builder();
  const usersBuilder = builder();

  groupsBuilder.fixture(Group, 'administrators', {
    name: 'Administrators',
  });

  usersBuilder
    .include('groups', groupsBuilder)
    .fixture(User, 'myuser', async get => ({
      firstName: 'John',
      lastName: 'Doe',
      groups: [await get(Group, 'administrators', 'groups')],
    }))
    .fixture(User, 'myuser2', async get => ({
      firstName: 'John',
      lastName: 'Doe',
      groups: [await get(Group, 'administrators', 'groups')],
    }));

  await usersBuilder.install(connection.manager);

  const groups = await connection.getRepository(Group).find();
  const users = await connection
    .getRepository(User)
    .find({ relations: ['groups'] });

  expect(groups).toMatchSnapshot('groups');
  expect(users).toMatchSnapshot('users');
});

it('should throw on non unique entity reference names', () => {
  expect(() => {
    builder()
      .fixture(User, 'user1', async get => ({
        firstName: 'John',
        lastName: 'Doe',
        groups: [await get(Group, 'administrators', 'groups')],
      }))
      .fixture(User, 'user1', async get => ({
        firstName: 'John',
        lastName: 'Doe',
        groups: [await get(Group, 'administrators', 'groups')],
      }));
  }).toThrow('Cannot push data since name is already taken: user1');
});

it('should throw on unknown builder reference', async () => {
  await expect(
    builder()
      .fixture(User, 'user1', async get => ({
        firstName: 'John',
        lastName: 'Doe',
        groups: [await get(Group, 'administrators', 'groups')],
      }))
      .fixture(User, 'user2', async get => ({
        firstName: 'John',
        lastName: 'Doe',
        groups: [await get(Group, 'administrators', 'groups')],
      }))
      .install(connection.manager),
  ).rejects.toThrow('Unable to find builder reference for name "groups"');
});

it('should throw on unknown entity reference', async () => {
  const groupsBuilder = builder().fixture(Group, 'administrators', {
    name: 'Administrators',
  });

  await expect(
    builder()
      .include('groups', groupsBuilder)
      .fixture(User, 'user1', async get => ({
        firstName: 'John',
        lastName: 'Doe',
        groups: [await get(Group, 'unknown', 'groups')],
      }))
      .install(connection.manager),
  ).rejects.toThrow(
    'Unable to find fixture reference for name "unknown" in builder "groups"',
  );
});

it('should throw on unknown entity reference in same builder', async () => {
  await expect(
    builder()
      .fixture(Group, 'administrators', {
        name: 'Administrators',
      })
      .fixture(User, 'user1', async get => ({
        firstName: 'John',
        lastName: 'Doe',
        groups: [await get(Group, 'unknown')],
      }))
      .install(connection.manager),
  ).rejects.toThrow('Unable to find fixture reference for name "unknown"');
});

it('should throw on entity reference type mismatch', async () => {
  const groupsBuilder = builder().fixture(Group, 'administrators', {
    name: 'Administrators',
  });

  await expect(
    builder()
      .include('groups', groupsBuilder)
      .fixture(User, 'user1', async get => ({
        firstName: 'John',
        lastName: 'Doe',
        groups: [await get(User, 'administrators', 'groups')],
      }))
      .install(connection.manager),
  ).rejects.toThrow(
    'Type mismatch for reference "administrators": Expected "User" but found "Group"',
  );
});

it('should call custom resolvers', async () => {
  const usersBuilder = builder();

  usersBuilder
    .resolve(User, async ({ firstName, lastName }, repository) =>
      repository.findOne({
        where: {
          firstName,
          lastName,
        },
      }),
    )
    .resolve(Group, async ({ name }, repository) =>
      repository.findOne({
        where: {
          name,
        },
      }),
    )
    .fixture(Group, 'administrators', {
      name: 'Administrators',
    })
    .fixture(User, 'myuser', async get => ({
      firstName: 'John',
      lastName: 'Doe',
      groups: [await get(Group, 'administrators')],
    }));

  await usersBuilder.install(connection.manager);
  await usersBuilder.install(connection.manager);

  const groups = await connection.getRepository(Group).find();
  const users = await connection
    .getRepository(User)
    .find({ relations: ['groups'] });

  expect(groups).toMatchSnapshot('groups');
  expect(users).toMatchSnapshot('users');
});
