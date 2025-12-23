import { checkMicrophonePermission } from '../monitoring/microphone-permission';
import { PermissionStatus } from '../monitoring/tracking-events.enum';

describe('checkMicrophonePermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use Permissions API when available', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ state: 'granted' });
    Object.defineProperty(global.navigator, 'permissions', {
      value: { query: mockQuery },
      writable: true,
      configurable: true,
    });

    const result = await checkMicrophonePermission();

    expect(result.status).toBe(PermissionStatus.GRANTED);
    expect(mockQuery).toHaveBeenCalledWith({ name: 'microphone' });
  });

  it('should return DENIED when Permissions API returns denied', async () => {
    const mockQuery = jest.fn().mockResolvedValue({ state: 'denied' });
    Object.defineProperty(global.navigator, 'permissions', {
      value: { query: mockQuery },
      writable: true,
      configurable: true,
    });

    const result = await checkMicrophonePermission();

    expect(result.status).toBe(PermissionStatus.DENIED);
  });

  it('should fallback to getUserMedia on Safari', async () => {
    Object.defineProperty(global.navigator, 'permissions', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    
    const mockStop = jest.fn();
    const mockGetUserMedia = jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: mockStop }],
    });
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
      configurable: true,
    });

    const result = await checkMicrophonePermission();

    expect(result.status).toBe(PermissionStatus.GRANTED);
    expect(mockStop).toHaveBeenCalled(); // Verify cleanup
  });

  it('should handle permission denied error', async () => {
    Object.defineProperty(global.navigator, 'permissions', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    
    const mockError = new Error('Permission denied');
    mockError.name = 'NotAllowedError';
    
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockRejectedValue(mockError),
      },
      writable: true,
      configurable: true,
    });

    const result = await checkMicrophonePermission();

    expect(result.status).toBe(PermissionStatus.DENIED);
    expect(result.errorName).toBe('NotAllowedError');
    expect(result.errorMessage).toBe('Permission denied');
  });

  it('should handle NotFoundError (no microphone)', async () => {
    Object.defineProperty(global.navigator, 'permissions', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    
    const mockError = new Error('Requested device not found');
    mockError.name = 'NotFoundError';
    
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockRejectedValue(mockError),
      },
      writable: true,
      configurable: true,
    });

    const result = await checkMicrophonePermission();

    expect(result.status).toBe(PermissionStatus.DENIED);
    expect(result.errorName).toBe('NotFoundError');
  });
});
