import { ConnectionOptionsReader, createConnection } from 'typeorm';
import { Task } from './task';

/**
 * Connects to the database and stores the connection on the
 * context.
 *
 * @param args
 */
export const connect: Task = async args => {
  const { setStatus, pushInfo, context, options } = args;
  const { connection: connectionName = 'default' } = options;

  setStatus('Connecting to database...');

  try {
    context.connection = await createConnection(
      await new ConnectionOptionsReader({
        root: process.cwd(),
      }).get(connectionName),
    );
  } catch (error) {
    context.connection = await createConnection(connectionName);
  }

  pushInfo({ text: '✔ Database connected', color: 'green' });
};
