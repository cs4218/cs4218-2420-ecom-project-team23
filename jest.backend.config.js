module.exports = {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/controllers/*.test.js", "<rootDir>/models/*.test.js", "<rootDir>/config/*.test.js"],

  // to remove reference error
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: ["controllers/**", "models/**", "config/db.js", "models/userModel.js"],
  coverageThreshold: {
    global: {
      lines: 0,
      functions: 0,
    },
  },
};


