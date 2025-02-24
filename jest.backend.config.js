export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/controllers/*.test.js", "<rootDir>/models/*.test.js"],

  // to remove reference error
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: ["controllers/**", "models/**"],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
