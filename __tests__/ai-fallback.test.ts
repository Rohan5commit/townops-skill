/**
 * Tests for AI fallback paths.
 *
 * Verifies that the rule-based fallback classification and resident update
 * generation work correctly when the AI service is unavailable.
 */

import { fallbackClassify } from '@/lib/ai/classify';

describe('AI Classification Fallback', () => {
  it('should classify water-related issues', () => {
    const result = fallbackClassify('Water main break on Oak Street', 'A significant water leak causing flooding');
    expect(result.type).toBe('water_leak');
    expect(result.suggestedDepartment).toBe('utilities');
    expect(result.severity).toBe('high');
    expect(result.urgency).toBe('urgent');
    expect(result.confidence).toBe(0.6);
    expect(result.reasoning).toContain('fallback');
  });

  it('should classify pothole issues', () => {
    const result = fallbackClassify('Large pothole on Main St', 'A deep pothole has formed in the road');
    expect(result.type).toBe('pothole');
    expect(result.suggestedDepartment).toBe('public_works');
  });

  it('should classify streetlight issues', () => {
    const result = fallbackClassify('Streetlight outage on Elm Blvd', 'Multiple streetlights are out');
    expect(result.type).toBe('streetlight_outage');
    expect(result.suggestedDepartment).toBe('public_works');
  });

  it('should classify trash/sanitation issues', () => {
    const result = fallbackClassify('Trash bins overflowing', 'Multiple trash bins are overflowing at the park');
    expect(result.type).toBe('trash_overflow');
    expect(result.suggestedDepartment).toBe('sanitation');
  });

  it('should classify noise complaints', () => {
    const result = fallbackClassify('Noise complaint at construction site', 'Loud construction noise during restricted hours');
    expect(result.type).toBe('noise_complaint');
    expect(result.suggestedDepartment).toBe('code_enforcement');
  });

  it('should classify graffiti issues', () => {
    const result = fallbackClassify('Graffiti on public wall', 'Large graffiti tags on the waterfront wall');
    expect(result.type).toBe('graffiti');
    expect(result.suggestedDepartment).toBe('code_enforcement');
  });

  it('should classify tree hazard issues', () => {
    const result = fallbackClassify('Damaged tree near power lines', 'A large tree is leaning toward power lines');
    expect(result.type).toBe('tree_hazard');
    expect(result.suggestedDepartment).toBe('parks_rec');
  });

  it('should escalate to critical for danger keywords', () => {
    const result = fallbackClassify('Danger: Gas leak detected', 'A dangerous gas leak near residential area');
    expect(result.severity).toBe('critical');
    expect(result.urgency).toBe('emergency');
  });

  it('should escalate for emergency keywords', () => {
    const result = fallbackClassify('Emergency: Fallen power line', 'Emergency situation with downed power lines');
    expect(result.severity).toBe('critical');
    expect(result.urgency).toBe('emergency');
  });

  it('should default to pothole/general for unrecognized issues', () => {
    const result = fallbackClassify('Something weird happened', 'Unusual occurrence reported by citizen');
    expect(result.type).toBe('pothole');
    expect(result.suggestedDepartment).toBe('general');
    expect(result.severity).toBe('medium');
    expect(result.urgency).toBe('soon');
  });

  it('should always return a valid confidence score', () => {
    const result = fallbackClassify('Test issue', 'Test description');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('should always include SLA recommendation', () => {
    const result = fallbackClassify('Test issue', 'Test description');
    expect(result.recommendedSLA).toBeDefined();
    expect(result.recommendedSLA.length).toBeGreaterThan(0);
  });

  it('should always include summary and reasoning', () => {
    const result = fallbackClassify('Test issue title here', 'Test description here');
    expect(result.summary).toBeDefined();
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.reasoning).toBeDefined();
    expect(result.reasoning.length).toBeGreaterThan(0);
  });
});
