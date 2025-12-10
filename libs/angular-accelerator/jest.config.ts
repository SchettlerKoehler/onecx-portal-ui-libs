/* eslint-disable */
import { createReportsConfig } from '../../jest-config-factory'

export default {
  displayName: 'angular-accelerator',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  transform: {
    '^.+\\.(mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
    '^.+\\.tsx?$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
        diagnostics: {
          ignoreCodes: [1343],
        },
        astTransformers: {
          before: [
            {
              path: 'ts-jest-mock-import-meta',
              options: { metaObjectReplacement: { url: 'https://www.url.com' } },
            },
          ],
        },
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  moduleNameMapper: {
    '^d3-(.*)$': `d3-$1/dist/d3-$1`,
    '@primeng/themes': '<rootDir>/../../node_modules/@primeng/themes/index.mjs',
    '^@onecx/angular-accelerator/model$': '<rootDir>/model/public-api.ts',
    '^@onecx/angular-accelerator/column-group-selection$': '<rootDir>/column-group-selection/public-api.ts',
    '^@onecx/angular-accelerator/custom-group-column-selector$': '<rootDir>/custom-group-column-selector/public-api.ts',
    '^@onecx/angular-accelerator/content$': '<rootDir>/content/public-api.ts',
    '^@onecx/angular-accelerator/content-container$': '<rootDir>/content-container/public-api.ts',
  },
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
  testEnvironment: '@happy-dom/jest-environment',
  ...createReportsConfig('angular-accelerator'),
}
