[![Build Status](https://travis-ci.org/jeanfortheweb/typeorm-fixture-builder.svg?branch=master)](https://travis-ci.org/jeanfortheweb/typeorm-fixture-builder) [![Maintainability](https://api.codeclimate.com/v1/badges/e37027e3a284fbf4f7d1/maintainability)](https://codeclimate.com/github/jeanfortheweb/typeorm-fixture-builder/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/e37027e3a284fbf4f7d1/test_coverage)](https://codeclimate.com/github/jeanfortheweb/typeorm-fixture-builder/test_coverage)

# typeorm-fixture-builder <!-- omit in toc -->

**typeorm-fixture-builder** was created when I struggled with the current fixture solutions for typeorm avaible. They simply didn't fit my needs and/or weren't flexible enough. So I decided to create another one.

# Documentation <!-- omit in toc -->

- [Installation](#installation)
- [Usage](#usage)
- [Fixture Bundle Files](#fixture-bundle-files)
- [Relations](#relations)
- [Foreign Bundle Files and Helpers](#foreign-bundle-files-and-helpers)
- [Soft Fixture Creation / Resolvers](#soft-fixture-creation--resolvers)
- [Programmatic Usage](#programmatic-usage)
- [Clearing the persistence cache](#clearing-the-persistence-cache)

# Installation

Install `typeorm-fixture-builder` and it's peer dependencies. Usually you will install `typescript` as dev dependency:

```sh
yarn add typeorm typeorm-fixture-builder
yarn add -D typescript
```

This will give you access to the `fixtures` cli utitlity as also to the programmatic api.

# Usage

We need at least one fixture bundle.
Fixtures are written - as typeorm itself - in typescript.
Therefore, we are able to create typesafe fixture definitions.
By default, the CLI will look for a `fixtures` folder, scanning for all files with a `.bundle.ts` suffix:

```ts
import { fixture } from 'typeorm-fixture-builder';
import { User } from '../entities/user.entity';

export const user1 = fixture(User, {
  firstName: 'John',
  lastName: 'Doe',
});

export const user2 = fixture(User, {
  firstName: 'Max',
  lastName: 'Mustermann',
});
```

Now you can run these fixtures using the CLI:

```sh
# yarn
yarn fixtures install

# npm/npx
npx fixtures install
```

For more CLI options checkout

```sh
# yarn
yarn fixtures --help
yarn fixtures install --help

# npm/npx
npx fixtures --help
npx fixtures install --help
```

# Fixture Bundle Files

The CLI will collect your fixtures from bundles in a smart but yet simple way.
Every fixture you want to get peristed has to be exported by the bundle file. Also,
it's not allowed to export anything else but fixtures from a bundle file.

However, there are exceptions to this which will allow you to organize fixtures the way you
wish to.

The following rules apply to exports from bundle files:

1. The export is a fixture itself:

   ```ts
   import { fixture } from 'typeorm-fixture-builder';
   import { User } from '../entities/User.entity';

   export const user = fixture(User, { firstName: 'Foo' });
   ```

2. The export is an array of fixtures:

   ```ts
   import { fixture } from 'typeorm-fixture-builder';
   import { User } from '../entities/User.entity';

   export const users = [
     fixture(User, { firstName: 'Foo' }),
     fixture(User, { firstName: 'Bar' }),
     fixture(User, { firstName: 'Baz' }),
   ];
   ```

3. The export is an Object where the property values are fixtures:

   ```ts
   import { fixture } from 'typeorm-fixture-builder';
   import { User } from '../entities/User.entity';

   export const users = {
     foo: fixture(User, { firstName: 'Foo' }),
     bar: fixture(User, { firstName: 'Bar' }),
     baz: fixture(User, { firstName: 'Baz' }),
   };
   ```

These rules can be combined to allow deeper nested structures:

```ts
import { fixture } from 'typeorm-fixture-builder';
import { User } from '../entities/User.entity';
import { Picture } from '../entities/picture.entity';

export const users = [
  {
    user: fixture(User, { firstName: 'Foo' }),
    picture: fixture(Picture, { path: 'foo.jpg' }),
  },
  {
    user: fixture(User, { firstName: 'Bar' }),
    picture: fixture(Picture, { path: 'Bar.jpg' }),
  },
];
```

# Relations

Relations as easy to manage as they can get. Just assign a fixture as a relation and you are done. The CLI will handle your relations.

You do not have to care about cascade setups since the CLI will walk
over your relations, no matter on which side of the relation.

Also, the CLI ensures that every fixture is persisted exactly once.
While you could place related fixtures inside a fixture without exporting
it from the bundle, it's still a good practice to export all fixtures
you define:

```ts
import { fixture } from 'typeorm-fixture-builder';
import { Group } from '../entities/group.entity';

export const groups = {
  administrators: fixture(Group, { name: 'Administrators' }),
  customers: fixture(Group, { name: 'Customers' }),
};

export const users = [
  fixture(User, {
    firstName: 'Admin',
    groups: [groups.administrators],
  }),

  fixture(User, {
    firstName: 'Customer',
    groups: [groups.customers],
  }),
];
```

# Foreign Bundle Files and Helpers

It's absolutely safe to use fixtures from foreign bundle files:

```ts
// fixtures/groups.bundle.ts
import { fixture } from 'typeorm-fixture-builder';
import { Group } from '../entities/group.entity';

export const administrators: fixture(Group, { name: 'Administrators' });
export const customers: fixture(Group, { name: 'Customers' });
```

```ts
// fixtures/users.bundle.ts
import { fixture } from 'typeorm-fixture-builder';
import { User } from '../entities/user.entity';
import { administrators, customers } from './groups.bundle';

export const administrator = fixture(User, {
  firstName: 'Admin',
  groups: [administrators],
});

export const customer = fixture(User, {
  firstName: 'Customer',
  groups: [customers],
});
```

You could even define your fixtures, or functions that will create fixtures
in non bundle files. It's only important that all your intended fixtures are exported from a bundle file in the end:

```ts
import { fixture } from 'typeorm-fixture-builder';
import faker from 'faker';
import { groups } from './groups.bundle';

export function createRandomUser(): User {
  return fixture(User, {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    groups: [faker.random.arrayElement(groups)],
  });
}

export function createRandomUsers(count: number): User[] {
  return [...new Array(count)].map(createRandomUser);
}
```

```ts
import { builder } from 'typeorm-fixture-builder';
import { User } from '../entities/user.entity';
import { createRandomUsers } from './helpers.ts';

export const users = createRandomUsers(10);
```

# Soft Fixture Creation / Resolvers

Sometimes, we do not want to create new database entries but use existing ones to update them or to prevent new data creation when fixtures run more
than once.

This can be achieved by passing a third parameter to the `fixture` function.

It has to be a callback which will receive the repository for the entity
and the fixture values and should return a setup query builder. We call
this a `resolver function`.

The CLI will use this query builder to find a single entity by it's criteria. If it finds an entity, it will be merged with the fixture data,
otherwise a new entity will be persisted:

```ts
import { fixture } from 'typeorm-fixture-builder';
import { User } from '../entities/user.entity';

export const user = fixture(
  User,
  { firstName: 'Foo', lastName: 'Bar' },
  (repository, { firstName }) =>
    repository
      .createQueryBuilder('user')
      .where('user.firstName = :firstName', { firstName }),
);
```

However, if you want to do this often on a certain type of entity, or even with a fixed set of conditions, it's useful to create a decorated fixture function which will setup the `resolver function` for you:

```ts
import { fixture } from 'typeorm-fixture-builder';
import { DeepPartial } from 'typeorm';
import { User } from '../entities/user.entity';

function createOrUpdateUser(data: DeepPartial<User>) {
  return fixture(User, data, (repository, { firstName }) =>
    repository
      .createQueryBuilder('user')
      .where('user.firstName = :firstName', { firstName }),
  );
}

export const user = createOrUpdateUser({
  firstName: 'Foo',
  lastName: 'Bar',
});
```

Such functions could also be placed in some kind of non bundle helper files, of course.

# Programmatic Usage

If you just want to install some fixtures programmatically, you can import and use the `install` function. It takes a TypeORM connection and an array of fixtures:

```ts
import { fixture, install } from 'typeorm-fixture-builder';
import { createConnection } from 'typeorm';
import { User } from '../entities/user.entity';

export const user1 = fixture(User, {
  firstName: 'John',
  lastName: 'Doe',
});

export const user2 = fixture(User, {
  firstName: 'Max',
  lastName: 'Mustermann',
});

async function installFixtures() {
  await install(await createConnection(), [user1, user2]);
}

installFixtures();
```

You can also import and collect fixtures from bundle files. Import and use the `collect` function. Pass the imported bundle module and it will return an array of collected fixtures:

```ts
import { collect, install } from 'typeorm-fixture-builder';
import { createConnection } from 'typeorm';
import UserBundle from '../fixtures/user.bundle';

async function installFixtures() {
  await install(await createConnection(), collect(UserBundle));
}

installFixtures();
```

# Clearing the Persistence Cache

Internally, the library will cache every fixture it has already persisted.
This can become quite cumbersome, for example when you're using fixtures in end to end
testing scenarios which wants to redeploy fixtures frequently in one process.

To overcome this, you can use the `clear` function before calling `install` again, which will clear the internal caching, allowing fixtures to be persisted again:

```ts
import { collect, install, clear } from 'typeorm-fixture-builder';
import { createConnection } from 'typeorm';
import UserBundle from '../fixtures/user.bundle';

beforeEach(async () => {
  await install(await createConnection(), collect(UserBundle));
});

afterEach(() => {
  clear();
});

// your tests using fixtures...
```
