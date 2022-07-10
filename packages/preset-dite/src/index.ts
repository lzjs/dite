export default () => {
  return {
    plugins: [
      require.resolve('./features/configPlugins/configPlugins'),
      // commands
      require.resolve('./commands/routes'),
      require.resolve('./commands/version'),
      require.resolve('./commands/dev/dev'),
    ],
  };
};
