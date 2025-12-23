/**
 * Centralized event taxonomy for type-safe tracking
 * 
 * Benefits:
 * - ✅ Prevents typos in event names
 * - ✅ Enables IDE autocomplete
 * - ✅ Single source of truth for all events
 * - ✅ Easy to audit and maintain
 * 
 * @example
 * ```typescript
 * import { TrackingEvent } from './tracking-events.enum';
 * 
 * monitoring.trackEvent(TrackingEvent.CALL_INITIATED, {
 *   vendor: 'VendorA',
 *   userId: '123'
 * });
 * ```
 */
export enum TrackingEvent {
  // Connection Events
  CLIENT_CONNECTING = 'Client_Connecting',
  CLIENT_CONNECTED = 'Client_Connected',
  CLIENT_DISCONNECTED = 'Client_Disconnected',
  CLIENT_AUTH = 'Client_Auth',

  // Call Events
  CALL_INITIATED = 'Call_Initiated',
  CALL_STATE_CHANGE = 'Call_StateChange',
  CALL_ERROR = 'Call_Error',
  CALL_ENDED = 'Call_Ended',
  CALL_STUCK = 'Call_Stuck',

  // Business Events
  PHONE_NUMBER_REQUEST = 'PhoneNumber_Request',
  DATA_SYNC_FAILURE = 'Data_Sync_Failure',
  PERMISSION_REQUEST = 'Permission_Request',
}

/**
 * Permission status enum for cross-browser compatibility
 */
export enum PermissionStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  PROMPT = 'prompt',
}
