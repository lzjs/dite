import fork from '../server/fork';

export function dev() {
  const child = fork({
    scriptPath: require.resolve('./forkedDev'),
  });
  // ref:
  // http://nodejs.cn/api/process/signal_events.html
  // https://lisk.io/blog/development/why-we-stopped-using-npm-start-child-processes
  process.on('SIGINT', () => {
    child.kill('SIGINT');
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    child.kill('SIGTERM');
    process.exit(1);
  });
}
