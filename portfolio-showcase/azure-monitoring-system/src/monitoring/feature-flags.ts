/**
 * Feature flags configuration
 */
export interface FeatureFlags {
  monitoring: {
    enabled: boolean;
    enableCallTracking: boolean;
    enableMicTracking: boolean;
  };
  calling: {
    enableVendorA: boolean;
    enableVendorB: boolean;
    enableVendorC: boolean;
  };
}

/**
 * Load feature flags from environment variables
 * 
 * Benefits:
 * - ✅ Instant production toggles without deployment
 * - ✅ A/B testing capabilities
 * - ✅ Gradual rollout support
 * - ✅ Emergency kill switch
 * 
 * @returns Loaded feature flags
 * 
 * @example
 * ```typescript
 * const flags = loadFeatureFlags();
 * 
 * if (flags.monitoring.enableCallTracking) {
 *   monitoring.trackEvent('Call_Initiated', { ... });
 * }
 * ```
 */
export function loadFeatureFlags(): FeatureFlags {
  return {
    monitoring: {
      enabled: import.meta.env.VITE_MONITORING_ENABLED === 'true',
      enableCallTracking: import.meta.env.VITE_ENABLE_CALL_TRACKING === 'true',
      enableMicTracking: import.meta.env.VITE_ENABLE_MIC_TRACKING === 'true',
    },
    calling: {
      enableVendorA: import.meta.env.VITE_ENABLE_VENDOR_A === 'true',
      enableVendorB: import.meta.env.VITE_ENABLE_VENDOR_B === 'true',
      enableVendorC: import.meta.env.VITE_ENABLE_VENDOR_C === 'true',
    },
  };
}

/**
 * React hook for feature flags
 * 
 * @param flagPath - Dot-separated path to flag (e.g., 'monitoring.enableCallTracking')
 * @returns Boolean flag value
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const isCallTrackingEnabled = useFeatureFlag('monitoring.enableCallTracking');
 *   
 *   if (isCallTrackingEnabled) {
 *     return <CallButton />;
 *   }
 *   
 *   return null;
 * }
 * ```
 */
export function useFeatureFlag(flagPath: string): boolean {
  const flags = loadFeatureFlags();
  const value = flagPath.split('.').reduce((obj, key) => obj?.[key], flags as any);
  return Boolean(value);
}
