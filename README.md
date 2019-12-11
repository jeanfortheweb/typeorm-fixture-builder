[![Build Status](https://travis-ci.org/jeanfortheweb/typeorm-fixture-builder.svg?branch=master)](https://travis-ci.org/jeanfortheweb/typeorm-fixture-builder) [![Maintainability](https://api.codeclimate.com/v1/badges/e37027e3a284fbf4f7d1/maintainability)](https://codeclimate.com/github/jeanfortheweb/typeorm-fixture-builder/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/e37027e3a284fbf4f7d1/test_coverage)](https://codeclimate.com/github/jeanfortheweb/typeorm-fixture-builder/test_coverage)

# typeorm-fixture-builder <!-- omit in toc -->

**typeorm-fixture-builder** was created when I struggled with the current fixture solutions for typeorm avaible. They simply didn't fit my needs and/or weren't flexible enough. So I decided to create another one.

For a comparison to other libraries check the bottom of this readme.

**typeorm-fixture-builder** is completely written in TypeScript and supports advanced typings.

# Documentation <!-- omit in toc -->

- [Installation](#installation)
- [Usage](#usage)
  - [The First Fixture](#the-first-fixture)
  - [Relations](#relations)
  - [Foreign Builders](#foreign-builders)
  - [Lists and Loops](#lists-and-loops)
  - [Soft Fixture Creation](#soft-fixture-creation)
  - [Programmatic Usage](#programmatic-usage)
- [Comparison to typeorm-fixtures-cli](#comparison-to-typeorm-fixtures-cli)
- [Comparison to typeorm-fixtures](#comparison-to-typeorm-fixtures)


# Installation

Install `typeorm-fixture-builder` and it's peer dependencies. Usually you will install `typescript` as dev dependency:

```sh
yarn add typeorm typeorm-fixture-builder
yarn add -D typescript
```

This will give you access to the `fixtures` cli utitlity as also to the fixture builder for programmatic usage.

# Usage

Before we can define fixtures, we need at least one entity, of course:

```ts
// entities/user.entity.ts

import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  readonly id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  type: 'customer' | 'admin'
}
```

## The First Fixture

Now we need at least one fixture builder file.
Fixtures are written - as typeorm itself - in typescript. Therefore,
we are able to create typesafe fixture definitions. By default, the CLI
will look for a `fixtures` folder, scanning for all files with a `.fixture.ts` suffix:

```ts
// fixtures/users.fixture.ts

import { builder } from 'typeorm-fixture-builder';
import { User } from '../entities/user.entity';

export default builder()
  .fixture(User, 'admin', {
    firstName: 'John',
    lastName: 'Doe',
    type: 'admin',
  })
  .fixture(User, 'customer', {
    firstName: 'Max',
    lastName: 'Mustermann',
    type: 'customer',
  });
```

Now you can run these fixtures using the CLI:

```sh
yarn fixtures install
```

For more CLI options checkout

```sh
yarn fixtures --help
yarn fixtures install --help
```

## Relations

We can also build relations, of course. We doing so by defining `async data`. Let's spice up our `User` entity by adding a relation to a new `Group` entity, while dropping the `type` column:

```ts
// entities/group.ts

@Entity()
export class Group {
  @PrimaryGeneratedColumn()
  readonly id: number;

  @Column()
  name: string;
}
```

```ts
// fixtures/users.fixture.ts

import { builder } from 'typeorm-fixture-builder';
import { User } from '../entities/user.entity';
import { Group } from '../entities/group.entity';

export default builder()
  .fixture(User, 'admin', async get => ({
    firstName: 'John',
    lastName: 'Doe',
    groups: [await get(Group, 'admins')],
  }))
  .fixture(User, 'customer', async get => ({
    firstName: 'Max',
    lastName: 'Mustermann',
    groups: [await get(Group, 'customers')],
  }))
  .fixture(Group, 'admins', {
    name: 'Admins'
  })
  .fixture(Group, 'customers', {
    name: 'Customers'
  });
```

When defining data async, a `resolver function` is passed which can be used to retrieve `entity references` to other fixtures in our builder. The order of fixtures is irrelevant since they are created lazily. Also, we can mix all kinds of entities in a single file which allows us to organize fixture creation as we like to.

## Foreign Builders

Depending on how we want to organize fixtures, we can also include foreign fixture builders in the current one which gives us access to their `entity references`. Lets split up users and groups into two separate fixture files:


```ts
// fixtures/users.fixture.ts

import { builder } from 'typeorm-fixture-builder';
import { User } from '../entities/user.entity';
import groups from './groups.fixture.ts';

export default builder()
  .include('groups', groups)
  .fixture(User, 'admin', async get => ({
    firstName: 'John',
    lastName: 'Doe',
    groups: [await get(Group, 'admins', 'groups')],
  }))
  .fixture(User, 'customer', async get => ({
    firstName: 'Max',
    lastName: 'Mustermann',
    groups: [await get(Group, 'customers', 'groups')],
  }));
```


```ts
// fixtures/groups.fixture.ts

import { builder } from 'typeorm-fixture-builder';
import { Group } from '../entities/group.entity';

export default builder()
  .fixture(Group, 'admins', {
    name: 'Admins'
  })
  .fixture(Group, 'customers', {
    name: 'Customers'
  });
```

We are telling our builder to include a certain foreign builder before creating our own fixtures. We can do that as often as we want and order is still not a thing. To use their entity references we pass the builder reference name as third parameter to the `resolver function`.

## Lists and Loops

Often we want to create a bunch of fixtures, maybe a list of fake users. We do not need any special api for this. Just create a simple loop:

```ts
// fixtures/users.fixture.ts

import { builder } from 'typeorm-fixture-builder';
import { User } from '../entities/user.entity';
import { Group } from '../entities/group.entity';

const customerBuilder = builder();

for(let i = 0; i < 100; i++) {
  customerBuilder.fixture(User, `customer${i}`, async get => ({
    firstName: `Max ${i}`,
    lastName: `Mustermann ${i}`,
    groups: [await get(Group, 'customers')],
  }));
}

export default customerBuilder;
```

You could also use libraries like `faker` to generate you data inside those loops.

## Soft Fixture Creation

Often, you want to control which fixtures are actually created and which can be skipped, since they already exist. We call that `soft entity creation`. 

To do so, we can define custom resolvers on a builder:

```ts
// fixtures/users.fixture.ts

import { builder } from 'typeorm-fixture-builder';
import { User } from '../entities/user.entity';
import { Group } from '../entities/group.entity';

export default builder()
  .resolve(User, async ({ firstName, lastName }, repository) =>
    repository.findOne({
      where: {
        firstName,
        lastName,
      },
    }),
  )
  .fixture(User, 'admin', async get => ({
    firstName: 'John',
    lastName: 'Doe',
    groups: [await get(Group, 'admins')],
  }))
  .fixture(User, 'customer', async get => ({
    firstName: 'Max',
    lastName: 'Mustermann',
    groups: [await get(Group, 'customers')],
  }));
```

In this example, our custom resolver looks for users by their first and last name. If a persisted entity is returned, the builder will skip the creation of the fixture and uses the existing one.

## Programmatic Usage

This one is straight forward. Since fixture builder files are plain typescript, just import them where you need them and call their `install` function with the `entity manager` of your desired `typeorm connection`:

```ts
// install.ts
import { Builder } from 'typeorm-fixture-builder';
import { createConnection } from 'typeorm';
import users from './fixtures/users.fixture.ts';
import groups from './fixtures/groups.fixture.ts';

async function install(...builders: Builder[]) {
  const connection = await createConnection();

  for(const builder of builders) {
    await builder.install(connection.manager);
  }
} 

install(users, groups);
```

# Comparison to typeorm-fixtures-cli

- Typesafe fixture creation
- No need for any special syntax to create random or looped data: Just use randomization libraries and native loops as you wish
- Multiple entity types per fixture file allows freedom in fixture organization
- Our CLI allows custom patterns to retrieve fixture files, so you can place them anywhere you like
- Our CLI is typeorm configuration independend. ormconfig.yml? Fine! Environment variables? Fine! We let typeorm handle that

# Comparison to typeorm-fixtures

- Also written in typescript but our api is simpler and more straight forward. You got to do alot less to get the results you want
- We have a CLI utility while typeorm-fixtures has none