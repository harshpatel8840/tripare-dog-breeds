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
