import { TextProps } from 'ink';
import { ReactNode } from 'react';
import { Connection } from 'typeorm';
import type { ExecutorProps } from '../executor';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Fixture = any;
export type BundlePath = string;

/**
 * Mutable context object used by tasks.
 */
export interface Context {
  connection: Connection;
  fixtures: Record<BundlePath, Fixture[]>;
}

/**
 * Options to push static information to the console.
 */
export interface InfoOptions extends TextProps {
  text: ReactNode;
}

/**
 * Args received by a task function.
 *
 * @see Task
 */
export interface TaskArgs {
  setStatus(value: string | false): void;
  pushInfo(value: InfoOptions): void;
  context: Context;
  options: ExecutorProps;
}

/**
 * Describes a task function, executed by the Executor component
 *
 * @see Executor
 */
export interface Task {
  (args: TaskArgs): Promise<unknown>;
}
