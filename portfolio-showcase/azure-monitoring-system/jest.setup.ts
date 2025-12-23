import '@testing-library/jest-dom';

// Mock Application Insights
jest.mock('@microsoft/applicationinsights-web', () => ({
  ApplicationInsights: jest.fn().mockImplementation(() => ({
    loadAppInsights: jest.fn(),
    trackEvent: jest.fn(),
    trackException: jest.fn(),
    trackMetric: jest.fn(),
  })),
}));

// Mock navigator.permissions
Object.defineProperty(global.navigator, 'permissions', {
  value: {
    query: jest.fn(),
  },
  writable: true,
  configurable: true,
});

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn(),
  },
  writable: true,
  configurable: true,
});

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
