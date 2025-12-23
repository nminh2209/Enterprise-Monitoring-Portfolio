import { ApplicationInsights } from '@microsoft/applicationinsights-web';

/**
 * Configuration for Azure Application Insights
 */
export interface MonitoringConfig {
  connectionString?: string;
  enableTracking: boolean;
}

/**
 * MonitoringService - Enterprise-grade telemetry tracking
 * 
 * Features:
 * - Fire-and-forget pattern: Never blocks user operations
 * - Exponential backoff retry: Handles network failures gracefully
 * - Singleton pattern: One instance per app lifecycle
 * - Type-safe: Full TypeScript coverage
 * 
 * @example
 * ```typescript
 * const monitoring = MonitoringService.getInstance({
 *   connectionString: process.env.VITE_APP_INSIGHTS_CONNECTION_STRING,
 *   enableTracking: true
 * });
 * 
 * monitoring.trackEvent('User_Login', { userId: '123' });
 * ```
 */
class MonitoringService {
  private static instance: MonitoringService | null = null;
  private appInsights: ApplicationInsights | null = null;
  private config: MonitoringConfig;

  private constructor(config: MonitoringConfig) {
    this.config = config;
    this.initialize();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: MonitoringConfig): MonitoringService {
    if (!MonitoringService.instance && config) {
      MonitoringService.instance = new MonitoringService(config);
    }
    
    if (!MonitoringService.instance) {
      throw new Error('MonitoringService must be initialized with config first');
    }
    
    return MonitoringService.instance;
  }

  /**
   * Initialize Application Insights
   */
  private initialize(): void {
    if (!this.config.enableTracking || !this.config.connectionString) {
      console.warn('Monitoring disabled or missing connection string');
      return;
    }

    try {
      this.appInsights = new ApplicationInsights({
        config: {
          connectionString: this.config.connectionString,
          enableAutoRouteTracking: true,
          enableCorsCorrelation: true,
          enableUnhandledPromiseRejectionTracking: true,
          disableFetchTracking: false,
          samplingPercentage: 100,
        },
      });

      this.appInsights.loadAppInsights();
      console.log('✅ Application Insights initialized');
    } catch (error) {
      console.error('Failed to initialize Application Insights:', error);
    }
  }

  /**
   * Track custom event with fire-and-forget + retry logic
   * 
   * @param name - Event name (use TrackingEvent enum for type safety)
   * @param properties - Custom properties to attach to event
   * 
   * @example
   * ```typescript
   * trackEvent('Call_Initiated', {
   *   vendor: 'VendorA',
   *   userId: '123',
   *   callDuration: 45000
   * });
   * ```
   */
  public trackEvent(name: string, properties?: Record<string, any>): void {
    if (!this.config.enableTracking || !this.appInsights) {
      return;
    }

    // Fire-and-forget with retry logic
    this.retryOperation(
      () => {
        this.appInsights!.trackEvent(
          { name },
          {
            ...properties,
            timestamp: new Date().toISOString(),
          }
        );
      },
      2, // maxRetries
      100 // baseDelayMs
    ).catch((error) => {
      console.error(`Failed to track event "${name}":`, error);
    });
  }

  /**
   * Track exception with context
   * 
   * @param error - Error object
   * @param properties - Additional context
   * 
   * @example
   * ```typescript
   * try {
   *   await makeCall();
   * } catch (error) {
   *   monitoring.trackException(error, {
   *     vendor: 'VendorA',
   *     userId: '123'
   *   });
   * }
   * ```
   */
  public trackException(error: Error, properties?: Record<string, any>): void {
    if (!this.config.enableTracking || !this.appInsights) {
      console.error(error);
      return;
    }

    this.retryOperation(
      () => {
        this.appInsights!.trackException(
          {
            exception: error,
            severityLevel: 3, // Error level
          },
          {
            ...properties,
            timestamp: new Date().toISOString(),
          }
        );
      },
      3, // Higher retry count for exceptions
      100
    ).catch((retryError) => {
      console.error('Failed to track exception:', retryError);
      console.error('Original error:', error);
    });
  }

  /**
   * Track custom metric (e.g., call duration, load time)
   * 
   * @param name - Metric name
   * @param value - Numeric value
   * @param properties - Additional context
   * 
   * @example
   * ```typescript
   * monitoring.trackMetric('Call_Duration', 45000, {
   *   vendor: 'VendorA',
   *   userId: '123'
   * });
   * ```
   */
  public trackMetric(
    name: string,
    value: number,
    properties?: Record<string, any>
  ): void {
    if (!this.config.enableTracking || !this.appInsights) {
      return;
    }

    this.retryOperation(
      () => {
        this.appInsights!.trackMetric(
          { name, average: value },
          {
            ...properties,
            timestamp: new Date().toISOString(),
          }
        );
      },
      2,
      100
    ).catch((error) => {
      console.error(`Failed to track metric "${name}":`, error);
    });
  }

  /**
   * Exponential backoff retry pattern
   * 
   * Retries failed operations with increasing delays:
   * - Attempt 1: 100ms delay
   * - Attempt 2: 200ms delay
   * - Attempt 3: 400ms delay
   * 
   * @param operation - Function to retry
   * @param maxRetries - Maximum retry attempts
   * @param baseDelayMs - Base delay in milliseconds
   * @returns Promise resolving to operation result or undefined on failure
   */
  private async retryOperation<T>(
    operation: () => T,
    maxRetries: number,
    baseDelayMs: number
  ): Promise<T | undefined> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}

export default MonitoringService;
