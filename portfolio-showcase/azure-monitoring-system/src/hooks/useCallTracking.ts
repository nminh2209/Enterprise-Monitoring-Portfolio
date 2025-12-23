import { useEffect, useRef } from 'react';
import MonitoringService from '../monitoring/monitoring-service';
import { TrackingEvent } from '../monitoring/tracking-events.enum';
import { createPrivatePhoneData } from '../monitoring/phone-privacy.utils';

/**
 * Props for useCallTracking hook
 */
interface UseCallTrackingProps {
  monitoring: MonitoringService;
  vendor: string;
  userId: string;
  leadId?: string;
}

/**
 * React hook for tracking call lifecycle events
 * 
 * Features:
 * - ✅ Automatic cleanup on unmount
 * - ✅ PII masking for phone numbers
 * - ✅ Call duration tracking
 * - ✅ Vendor-agnostic (works with any telephony provider)
 * 
 * @param props - Hook configuration
 * @returns Tracking functions for call events
 * 
 * @example
 * ```typescript
 * function CallComponent({ monitoring, vendor, userId, leadId }) {
 *   const {
 *     trackCallInitiated,
 *     trackCallEnded,
 *     trackCallError
 *   } = useCallTracking({ monitoring, vendor, userId, leadId });
 * 
 *   const makeCall = async () => {
 *     try {
 *       trackCallInitiated('+84901234567', '+84987654321');
 *       await vendorSDK.makeCall();
 *     } catch (error) {
 *       trackCallError(error);
 *     }
 *   };
 * 
 *   return <button onClick={makeCall}>Make Call</button>;
 * }
 * ```
 */
export function useCallTracking({
  monitoring,
  vendor,
  userId,
  leadId,
}: UseCallTrackingProps) {
  const callStartTime = useRef<number | null>(null);

  /**
   * Track call initiation with masked phone numbers
   * 
   * @param fromPhone - Caller phone number
   * @param toPhone - Callee phone number
   */
  const trackCallInitiated = (fromPhone: string, toPhone: string) => {
    callStartTime.current = Date.now();

    const fromData = createPrivatePhoneData(fromPhone);
    const toData = createPrivatePhoneData(toPhone);

    monitoring.trackEvent(TrackingEvent.CALL_INITIATED, {
      vendor,
      userId,
      leadId,
      fromCarrier: fromData.carrier,
      fromMasked: fromData.maskedNumber,
      toCarrier: toData.carrier,
      toMasked: toData.maskedNumber,
    });
  };

  /**
   * Track call state changes (connecting, ringing, connected, etc.)
   * 
   * @param newState - New call state
   */
  const trackCallStateChange = (newState: string) => {
    monitoring.trackEvent(TrackingEvent.CALL_STATE_CHANGE, {
      vendor,
      userId,
      leadId,
      callState: newState,
    });
  };

  /**
   * Track call end with duration
   */
  const trackCallEnded = () => {
    const duration = callStartTime.current
      ? Date.now() - callStartTime.current
      : 0;

    monitoring.trackEvent(TrackingEvent.CALL_ENDED, {
      vendor,
      userId,
      leadId,
      durationMs: duration,
    });

    callStartTime.current = null;
  };

  /**
   * Track call errors
   * 
   * @param error - Error object
   */
  const trackCallError = (error: Error) => {
    monitoring.trackException(error, {
      vendor,
      userId,
      leadId,
      context: 'call_operation',
    });
  };

  // Cleanup: Track call end if unmounted during active call
  useEffect(() => {
    return () => {
      if (callStartTime.current !== null) {
        trackCallEnded();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    trackCallInitiated,
    trackCallStateChange,
    trackCallEnded,
    trackCallError,
  };
}
