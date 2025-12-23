import { PermissionStatus } from './tracking-events.enum';

/**
 * Result of microphone permission check
 */
export interface MicPermissionResult {
  status: PermissionStatus;
  errorName?: string;
  errorMessage?: string;
}

/**
 * Check microphone permission across all browsers
 * 
 * **Cross-browser strategy:**
 * - Chrome/Edge/Firefox: Uses Permissions API (non-invasive, no prompt)
 * - Safari: Falls back to getUserMedia (requires permission prompt)
 * 
 * **CRITICAL:** Always release microphone after Safari getUserMedia check
 * to avoid blocking other applications.
 * 
 * @returns Promise resolving to permission status
 * 
 * @example
 * ```typescript
 * const result = await checkMicrophonePermission();
 * 
 * if (result.status === PermissionStatus.GRANTED) {
 *   console.log('✅ Microphone access granted');
 * } else {
 *   console.log('❌ Microphone denied:', result.errorMessage);
 * }
 * ```
 */
export async function checkMicrophonePermission(): Promise<MicPermissionResult> {
  try {
    // Method 1: Permissions API (preferred, non-blocking)
    // Supported by Chrome, Edge, Firefox
    if (navigator.permissions) {
      const permissionStatus = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });

      return {
        status: permissionStatus.state === 'granted'
          ? PermissionStatus.GRANTED
          : PermissionStatus.DENIED,
      };
    }

    // Method 2: getUserMedia fallback (Safari)
    // IMPORTANT: This triggers a permission prompt in Safari
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // CRITICAL: Release microphone immediately to avoid blocking
    stream.getTracks().forEach((track) => track.stop());
    
    return { status: PermissionStatus.GRANTED };
    
  } catch (error: any) {
    return {
      status: PermissionStatus.DENIED,
      errorName: error?.name,
      errorMessage: error?.message,
    };
  }
}
