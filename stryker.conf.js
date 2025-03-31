module.exports = {
  packageManager: 'npm',
  incrementalFile: 'reports/tests/stryker/incremental.json',
  reporters: ['html', 'progress', 'dashboard'],
  htmlReporter: { fileName: 'reports/tests/stryker/index.html' },
  testRunner: 'jest',
  coverageAnalysis: 'perTest',
  disableTypeChecks: '**/*.ts',
  jest: {
    configFile: 'test/jest-unit.js',
    enableFindRelatedTests: true,
  },
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  incremental: true,
  ignoreStatic: true,
  mutate: [
    'src/**/*.ts',
    '!**/schemas/**',
    '!**/local.ts',
    '!**/index.ts',
  ],
  thresholds: {
    high: 100,
    low: 100,
    break: 100
  }
};
