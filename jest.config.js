module.exports = {
    roots: ['<rootDir>/tst/attributes/'],
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
    preset: '@shelf/jest-mongodb',
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  }