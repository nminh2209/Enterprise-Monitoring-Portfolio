import React, { useState } from 'react';
import { useCallTracking } from '../hooks/useCallTracking';
import MonitoringService from '../monitoring/monitoring-service';
import { checkMicrophonePermission } from '../monitoring/microphone-permission';
import { TrackingEvent, PermissionStatus } from '../monitoring/tracking-events.enum';

/**
 * Props for CallButton component
 */
interface CallButtonProps {
  monitoring: MonitoringService;
  vendor: string;
  userId: string;
  leadId: string;
  fromPhone: string;
  toPhone: string;
}

/**
 * CallButton - Complete call button with monitoring integration
 * 
 * Features:
 * - ✅ Microphone permission check
 * - ✅ Call lifecycle tracking
 * - ✅ Error handling with telemetry
 * - ✅ State management
 * 
 * @example
 * ```typescript
 * <CallButton
 *   monitoring={monitoringService}
 *   vendor="VendorA"
 *   userId="user123"
 *   leadId="lead456"
 *   fromPhone="+84901234567"
 *   toPhone="+84987654321"
 * />
 * ```
 */
export function CallButton({
  monitoring,
  vendor,
  userId,
  leadId,
  fromPhone,
  toPhone,
}: CallButtonProps) {
  const [calling, setCalling] = useState(false);
  const [callState, setCallState] = useState<string>('IDLE');

  const {
    trackCallInitiated,
    trackCallStateChange,
    trackCallEnded,
    trackCallError,
  } = useCallTracking({ monitoring, vendor, userId, leadId });

  /**
   * Handle call initiation with permission check
   */
  const handleMakeCall = async () => {
    try {
      // Step 1: Check microphone permission
      const micPermission = await checkMicrophonePermission();
      
      monitoring.trackEvent(TrackingEvent.PERMISSION_REQUEST, {
        userId,
        leadId,
        permissionStatus: micPermission.status,
        errorName: micPermission.errorName,
      });

      if (micPermission.status !== PermissionStatus.GRANTED) {
        alert('Microphone permission required');
        return;
      }

      // Step 2: Track call initiation
      trackCallInitiated(fromPhone, toPhone);

      // Step 3: Simulate call (replace with actual vendor SDK)
      setCalling(true);
      setCallState('CONNECTING');
      trackCallStateChange('CONNECTING');

      // Simulate connection delay
      setTimeout(() => {
        setCallState('CONNECTED');
        trackCallStateChange('CONNECTED');
      }, 2000);

    } catch (error) {
      trackCallError(error as Error);
      alert('Failed to make call');
    }
  };

  /**
   * Handle call termination
   */
  const handleEndCall = () => {
    trackCallEnded();
    setCalling(false);
    setCallState('IDLE');
  };

  return (
    <div style={{ padding: '20px' }}>
      <button
        onClick={calling ? handleEndCall : handleMakeCall}
        disabled={calling && callState !== 'CONNECTED'}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: calling ? '#dc2626' : '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: calling && callState !== 'CONNECTED' ? 'not-allowed' : 'pointer',
          opacity: calling && callState !== 'CONNECTED' ? 0.5 : 1,
        }}
      >
        {calling ? `End Call (${callState})` : 'Make Call'}
      </button>
      
      {calling && (
        <div style={{ marginTop: '10px', color: '#666' }}>
          <p>Status: {callState}</p>
          <p>From: {fromPhone}</p>
          <p>To: {toPhone}</p>
        </div>
      )}
    </div>
  );
}
