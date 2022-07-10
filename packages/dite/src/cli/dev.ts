import { DiteCommand } from '../bin/dite';
import fork from '../server/fork';
import { prepare } from './prepare';

const diteDev: DiteCommand<{ port: number }> = async (flags) => {
  await prepare();
  const child = fork({
    scriptPath: require.resolve('./utils/forkedDev'),
  });

  process.on('SIGINT', () => {
    child.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    child.kill('SIGTERM');
    process.exit(1);
  });
};

export default diteDev;
