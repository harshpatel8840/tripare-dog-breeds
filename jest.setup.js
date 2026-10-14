// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => {
  const netInfoMock = {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn().mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: {},
    }),
    useNetInfo: jest.fn(() => ({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: {},
    })),
  };
  return {
    __esModule: true,
    default: netInfoMock,
    ...netInfoMock,
  };
});

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => 'StatusBar',
}));

// Mock expo-image
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockExpoImage = (props) => React.createElement(View, { ...props, testID: props.testID || 'expo-image' });
  return {
    Image: MockExpoImage,
  };
});

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: { breedId: 'test-breed-id', breedName: 'Test Breed' },
    }),
  };
});

// Mock expo-file-system
jest.mock('expo-file-system', () => {
  class MockFile {
    exists = true;
    size = 1024;
    constructor(...uris) {
      this.uri = uris.map((u) => (typeof u === 'string' ? u : u.uri)).join('/');
    }
    delete = jest.fn();
    static downloadFileAsync = jest.fn().mockImplementation(async (url, dest) => ({
      uri: dest.uri || `file:///cache/mock_${url.slice(-10)}`,
      size: 1024,
    }));
  }

  class MockDirectory {
    uri = 'file:///cache/dog_images';
    exists = true;
    create = jest.fn();
    delete = jest.fn();
  }

  return {
    Paths: {
      cache: new MockDirectory(),
      document: new MockDirectory(),
    },
    File: MockFile,
    Directory: MockDirectory,
  };
});

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    runAsync: jest.fn().mockResolvedValue({ changes: 0, lastInsertRowId: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    execAsync: jest.fn().mockResolvedValue(undefined),
    withTransactionAsync: jest.fn(async (cb) => cb()),
  }),
  openDatabaseSync: jest.fn().mockReturnValue({
    runSync: jest.fn().mockReturnValue({ changes: 0, lastInsertRowId: 1 }),
    getFirstSync: jest.fn().mockReturnValue(null),
    getAllSync: jest.fn().mockReturnValue([]),
    execSync: jest.fn().mockReturnValue(undefined),
  }),
}));

