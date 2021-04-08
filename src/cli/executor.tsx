import spinners from 'cli-spinners';
import { Box, render, Static, Text } from 'ink';
import React, {
  ComponentType,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { collect } from './task/collect';
import { connect } from './task/connect';
import { install } from './task/install';
import { reset } from './task/reset';
import { Context, InfoOptions } from './task/task';
export interface ExecutorProps {
  connection?: string;
  resetDatabase: boolean;
  useMigrations: boolean;
  silent: boolean;
  pattern: string;
}

const Executor: ComponentType<ExecutorProps> = props => {
  const [infos, setInfos] = useState<InfoOptions[]>([]);
  const [status, setStatus] = useState<string | false>('');
  const [exception, setException] = useState<Error>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contextRef = useRef<Context>({ fixtures: {}, connection: null as any });

  const pushInfo = useCallback((value: InfoOptions) => {
    setInfos(statics => [...statics, value]);
  }, []);

  const execute = useCallback(async () => {
    try {
      for (const task of [connect, reset, collect, install]) {
        await task({
          setStatus,
          pushInfo,
          context: contextRef.current,
          options: props,
        });
      }
    } catch (error) {
      setException(error);
    }
  }, []);

  useEffect(() => {
    if (exception) {
      setTimeout(() => process.exit(1), 1);
    }
  }, [exception]);

  useEffect(() => {
    execute();
  }, []);

  return (
    <>
      {props.silent !== true && (
        <Static items={infos}>
          {({ text, ...props }, index) => (
            <Box key={index}>
              <Text {...props}>{text}</Text>
            </Box>
          )}
        </Static>
      )}

      {exception && <Text color="red">{exception.toString()}</Text>}

      {exception === undefined && status !== false && props.silent !== true && (
        <Text>
          <Spinner />
          {status}
        </Text>
      )}
    </>
  );
};

const Spinner: ComponentType = () => {
  const [frame, setFrame] = useState(0);
  const spinner = spinners['dots'];

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame(frame => {
        return frame === spinner.frames.length - 1 ? 0 : frame + 1;
      });
    }, spinner.interval);

    return () => {
      clearInterval(timer);
    };
  }, [spinner]);

  return <Text color="green">{spinner.frames[frame]} </Text>;
};

/**
 * Executes the fixture installation through ink.
 *
 * @param props Executor props
 */
export function execute(props: ExecutorProps): void {
  render(<Executor {...props} />);
}
