module.exports = {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/config/*.test.js", "<rootDir>/models/*.test.js"],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: ["config/db.js", "models/userModel.js"],
  coverageThreshold: {
    global: {
      lines: 0,
      functions: 0,
    },
  },
};
