import { sync } from 'glob';
import { relative } from 'path';
import { collect as collectFixtures } from '../../collect';
import { Task } from './task';

/**
 * Collects fixtures from bundles and stores them on the context
 * for later use.
 *
 * @param args
 */
export const collect: Task = async args => {
  const { setStatus, context, options } = args;
  const { pattern } = options;

  const bundles = sync(pattern, {
    cwd: process.cwd(),
    absolute: true,
  });

  for (const file of bundles) {
    const path = relative(process.cwd(), file);

    setStatus(`Collecting from ${path}`);

    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
    context.fixtures[path] = collectFixtures(require(file)) as any[];
  }
};
