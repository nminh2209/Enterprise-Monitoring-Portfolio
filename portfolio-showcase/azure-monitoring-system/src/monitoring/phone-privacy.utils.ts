/**
 * Generic carrier prefixes for demonstration
 * In production, this would be loaded from a database or config service
 */
const CARRIER_PREFIXES: Record<string, string[]> = {
  CarrierA: ['090', '091', '092', '093'],
  CarrierB: ['094', '095', '096', '097'],
  CarrierC: ['098', '099', '088', '089'],
};

/**
 * Masked phone data for safe logging (GDPR compliant)
 */
export interface PhoneData {
  maskedNumber: string;
  carrier: string;
  prefix: string;
}

/**
 * Detect carrier by phone prefix
 * 
 * @param phoneNumber - Full phone number with or without country code
 * @returns Carrier name or 'Unknown'
 * 
 * @example
 * ```typescript
 * detectCarrier('+84901234567') // 'CarrierA'
 * detectCarrier('0901234567')   // 'CarrierA'
 * ```
 */
export function detectCarrier(phoneNumber: string): string {
  const normalized = phoneNumber.replace(/\D/g, '');
  
  // Remove country code if present (84 for Vietnam)
  const withoutCountryCode = normalized.startsWith('84')
    ? '0' + normalized.substring(2)
    : normalized;

  const prefix = withoutCountryCode.substring(0, 3);

  for (const [carrier, prefixes] of Object.entries(CARRIER_PREFIXES)) {
    if (prefixes.includes(prefix)) {
      return carrier;
    }
  }

  return 'Unknown';
}

/**
 * Create masked phone data for safe logging (GDPR/PII compliant)
 * 
 * Masks middle digits while keeping first 3 and last 4 for debugging
 * Example: +84912345678 -> +849***5678
 * 
 * @param phoneNumber - Full phone number
 * @returns Masked phone data with carrier info
 * 
 * @example
 * ```typescript
 * const data = createPrivatePhoneData('+84912345678');
 * console.log(data.maskedNumber); // '+849***5678'
 * console.log(data.carrier);      // 'CarrierA'
 * ```
 */
export function createPrivatePhoneData(phoneNumber: string): PhoneData {
  const normalized = phoneNumber.replace(/\D/g, '');
  
  // Keep first 3 and last 4 digits
  const visiblePrefix = normalized.substring(0, 3);
  const visibleSuffix = normalized.substring(normalized.length - 4);
  const maskedNumber = `+${visiblePrefix}***${visibleSuffix}`;

  const carrier = detectCarrier(phoneNumber);
  const prefix = normalized.substring(0, 3);

  return {
    maskedNumber,
    carrier,
    prefix,
  };
}
