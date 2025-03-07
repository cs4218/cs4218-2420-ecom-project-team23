module.exports = {
  // name displayed during tests
  displayName: "frontend",

  // simulates browser environment in jest
  // e.g., using document.querySelector in your tests
  testEnvironment: "jest-environment-jsdom",

  // jest does not recognise jsx files by default, so we use babel to transform any jsx files
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  // tells jest how to handle css/scss imports in your tests
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },

  // ignore all node_modules except styleMock (needed for css imports)
  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],

  // only run these tests
  testMatch: ["<rootDir>/client/src/**/*.test.js"],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "client/src/components/Routes/Private.js",
    "client/src/components/UserMenu.js",
    "client/src/pages/user/Dashboard.js",
    "client/src/components/Footer.js",
    "client/src/components/Header.js",
    "client/src/components/Layout.js",
    "client/src/components/Spinner.js",
    "client/src/pages/About.js",
    "client/src/pages/Pagenotfound.js",
    "client/src/pages/HomePage.js",
  ],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
