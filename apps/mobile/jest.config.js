const path = require('path');

module.exports = {
  preset: "react-native",
  rootDir: '.',
  moduleDirectories: ['node_modules', '../../node_modules'],
  transformIgnorePatterns: [
    "../../node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/__tests__/integration/utils/",
  ],
  setupFilesAfterEnv: ["./jest-setup.ts"],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    "^.+\\.[jt]sx?$": ["babel-jest", { configFile: "./babel.config.js" }]
  },
};
