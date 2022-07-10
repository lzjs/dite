import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  modulePathIgnorePatterns: [
    '<rootDir>/.tmp',
    '<rootDir>/examples',
    '<rootDir>/templates',
    '<rootDir>/packages/.+/compiled',
    '<rootDir>/packages/.+/fixtures',
  ],
  moduleNameMapper: {
    testUtils: '<rootDir>/packages/playground/testUtils.ts',
  },
  testMatch: ['**/*.test.(t|j)s(x)?'],
  testTimeout: 30000,
};

export default config;
