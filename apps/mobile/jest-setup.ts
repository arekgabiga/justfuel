import 'regenerator-runtime/runtime';

// Polyfill for expo-modules-core
process.env.EXPO_OS = 'ios';

// Mock Expo NativeModulesProxy to fix "The 'EXNativeModulesProxy' native module is not exported..." warning
jest.mock('expo-modules-core', () => {
    const actual = jest.requireActual('expo-modules-core');
    return {
        ...actual,
        NativeModulesProxy: {},
    };
});

// Mock Vector Icons (used by React Native Paper)
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
    return {
        default: (props: any) => null,
        __esModule: true,
    };
}, { virtual: true });

jest.mock('@expo/vector-icons', () => ({
    MaterialCommunityIcons: (props: any) => null,
}));

// Silence specific warnings (only environment-related ones)
const originalWarn = console.warn;
console.warn = (...args) => {
  const msg = args.join(' ');
  if (
    msg.includes('The global process.env.EXPO_OS is not defined') ||
    msg.includes('The "EXNativeModulesProxy" native module is not exported') ||
    msg.includes('CommonActions.setParams') || // Navigation warning often seen in tests
    msg.includes('overflow to hidden on Surface') // react-native-paper Surface component warning
  ) {
    return;
  }
  originalWarn(...args);
};

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn().mockResolvedValue(undefined),
    runAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    closeAsync: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substring(7)),
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///test-directory/',
  EncodingType: { UTF8: 'utf8' },
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue('date,fuel_amount,total_price\n01.01.2023,50,300'),
}));

// Mock expo-file-system/legacy
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///test-directory/',
  EncodingType: { UTF8: 'utf8' },
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue('date,fuel_amount,total_price\n01.01.2023,50,300'),
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}));
