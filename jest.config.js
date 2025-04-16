/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/frontend/tsconfig.json"
      }
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/frontend/src/$1"
  }
};