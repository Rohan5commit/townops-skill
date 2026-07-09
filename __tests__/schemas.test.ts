import { CreateIssueRequestSchema, isValidTransition, VALID_TRANSITIONS } from '../lib/schemas';

describe('Schema Validation', () => {
  describe('CreateIssueRequestSchema', () => {
    it('should validate a correct request', () => {
      const result = CreateIssueRequestSchema.safeParse({
        title: 'Test issue title',
        description: 'This is a test description that is long enough',
        type: 'water_leak',
        zone: 'downtown',
        location: '123 Main Street',
      });
      expect(result.success).toBe(true);
    });

    it('should reject title that is too short', () => {
      const result = CreateIssueRequestSchema.safeParse({
        title: 'Hi',
        description: 'This is a test description that is long enough',
        type: 'water_leak',
        zone: 'downtown',
        location: '123 Main Street',
      });
      expect(result.success).toBe(false);
    });

    it('should reject description that is too short', () => {
      const result = CreateIssueRequestSchema.safeParse({
        title: 'Test issue title',
        description: 'Short',
        type: 'water_leak',
        zone: 'downtown',
        location: '123 Main Street',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid issue type', () => {
      const result = CreateIssueRequestSchema.safeParse({
        title: 'Test issue title',
        description: 'This is a test description that is long enough',
        type: 'invalid_type',
        zone: 'downtown',
        location: '123 Main Street',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid zone', () => {
      const result = CreateIssueRequestSchema.safeParse({
        title: 'Test issue title',
        description: 'This is a test description that is long enough',
        type: 'water_leak',
        zone: 'invalid_zone',
        location: '123 Main Street',
      });
      expect(result.success).toBe(false);
    });

    it('should accept all valid issue types', () => {
      const types = [
        'water_leak', 'streetlight_outage', 'trash_overflow', 'pothole',
        'unsafe_crossing', 'park_maintenance', 'noise_complaint', 'graffiti',
        'broken_sidewalk', 'tree_hazard',
      ];
      types.forEach((type) => {
        const result = CreateIssueRequestSchema.safeParse({
          title: 'Test issue with valid type',
          description: 'This is a test description that is long enough',
          type,
          zone: 'downtown',
          location: '123 Main Street',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should accept all valid zones', () => {
      const zones = [
        'downtown', 'northside', 'southside', 'eastend', 'westend',
        'industrial', 'residential_north', 'residential_south',
        'park_district', 'waterfront',
      ];
      zones.forEach((zone) => {
        const result = CreateIssueRequestSchema.safeParse({
          title: 'Test issue with valid zone',
          description: 'This is a test description that is long enough',
          type: 'pothole',
          zone,
          location: '123 Main Street',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should use default values for optional fields', () => {
      const result = CreateIssueRequestSchema.safeParse({
        title: 'Test issue title',
        description: 'This is a test description that is long enough',
        type: 'water_leak',
        zone: 'downtown',
        location: '123 Main Street',
      });
      if (result.success) {
        expect(result.data.reportedBy).toBe('agent');
        expect(result.data.tags).toEqual([]);
      }
    });
  });
});
