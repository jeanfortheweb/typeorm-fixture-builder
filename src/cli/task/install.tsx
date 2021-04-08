/* eslint-disable @typescript-eslint/no-explicit-any */
import { Newline } from 'ink';
import React from 'react';
import { EntityMetadata } from 'typeorm';
import { install as installFixtures } from '../../install';
import { Fixture, Task } from './task';

/**
 * Pretty prints a labeled entity value using JSON.stringify
 *
 * @param property Property
 * @param content Content
 */
function value(property: string, content: any) {
  return [property, JSON.stringify(content)].join(': ');
}

/**
 * Pretty prints a fixture for console output.
 *
 * @param metadata Entity metadata
 * @param entity Entity instance.
 */
function pretty(metadata: EntityMetadata, entity: Fixture): string {
  const values = Object.keys(metadata.propertiesMap).reduce<string[]>(
    (values, property) => {
      if (entity[property] === undefined) {
        return values;
      }

      if (Array.isArray(entity[property])) {
        return [
          ...values,
          value(
            property,
            entity[property].map((value: any) =>
              value?.id !== undefined ? value.id : value,
            ),
          ),
        ];
      }

      if (entity[property]?.id !== undefined) {
        return [...values, value(property, entity[property].id)];
      }

      return [...values, value(property, entity[property])];
    },
    [],
  );

  return `${entity.constructor.name}(${values.join(', ')})`;
}

/**
 * Installs previoulsy collected fixtures.
 *
 * @param args
 */
export const install: Task = async args => {
  const { setStatus, pushInfo, context } = args;
  const { connection } = context;

  setStatus('');

  if (connection) {
    for (const [path, fixtures] of Object.entries(context.fixtures)) {
      pushInfo({
        underline: true,
        text: (
          <>
            <Newline />
            Installing {fixtures.length} fixtures from {path}:
          </>
        ),
      });

      await installFixtures(connection, fixtures, (entity, skipped) => {
        const prefix = skipped ? 'ℹ [SKIPPED]' : '›';
        const content = pretty(
          connection.getMetadata(entity.constructor),
          entity,
        );

        const text = [' ', prefix, content].join(' ');
        const color = skipped ? 'blue' : 'green';

        pushInfo({
          text,
          color,
        });
      });
    }

    setStatus(false);
  }

  process.exit(0);
};
