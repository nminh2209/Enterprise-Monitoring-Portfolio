import { createPrivatePhoneData, detectCarrier } from '../monitoring/phone-privacy.utils';

describe('Phone Privacy Utils', () => {
  describe('createPrivatePhoneData', () => {
    it('should mask middle digits', () => {
      const result = createPrivatePhoneData('+84912345678');
      
      expect(result.maskedNumber).toBe('+849***5678');
      expect(result.maskedNumber).not.toContain('1234');
    });

    it('should detect carrier correctly', () => {
      const result = createPrivatePhoneData('0901234567');
      
      expect(result.carrier).toBe('CarrierA');
      expect(result.prefix).toBe('090');
    });

    it('should handle different carriers', () => {
      expect(createPrivatePhoneData('0941234567').carrier).toBe('CarrierB');
      expect(createPrivatePhoneData('0981234567').carrier).toBe('CarrierC');
    });

    it('should preserve last 4 digits for debugging', () => {
      const result = createPrivatePhoneData('+84987654321');
      
      expect(result.maskedNumber).toContain('4321');
    });
  });

  describe('detectCarrier', () => {
    it('should handle country code', () => {
      expect(detectCarrier('+84901234567')).toBe('CarrierA');
      expect(detectCarrier('84941234567')).toBe('CarrierB');
    });

    it('should handle local format', () => {
      expect(detectCarrier('0901234567')).toBe('CarrierA');
      expect(detectCarrier('0941234567')).toBe('CarrierB');
    });

    it('should return Unknown for unrecognized prefix', () => {
      expect(detectCarrier('0801234567')).toBe('Unknown');
      expect(detectCarrier('0851234567')).toBe('Unknown');
    });

    it('should handle numbers with hyphens', () => {
      expect(detectCarrier('090-123-4567')).toBe('CarrierA');
    });
  });
});
