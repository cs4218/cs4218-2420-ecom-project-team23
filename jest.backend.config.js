module.exports = {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/config/*.test.js", "<rootDir>/models/*.test.js"],

  // jest code coverage
  collectCoverage: false,
  collectCoverageFrom: ["config/**", "models/**"],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
