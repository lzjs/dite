export default () => {
  return {
    plugins: [
      require.resolve('./features/configPlugins/configPlugins'),
      // commands
      require.resolve('./commands/routes'),
      require.resolve('./commands/version'),
      require.resolve('./commands/dev'),
      require.resolve('./commands/start'),
      require.resolve('./commands/build'),
      require.resolve('./commands/generate'),
      require.resolve('./commands/upgrade'),
    ],
  };
};
