import { isValidTransition, VALID_TRANSITIONS, type IssueStatus } from '../lib/schemas';

describe('State Transitions', () => {
  it('should allow reported → triaged', () => {
    expect(isValidTransition('reported', 'triaged')).toBe(true);
  });

  it('should allow reported → blocked', () => {
    expect(isValidTransition('reported', 'blocked')).toBe(true);
  });

  it('should disallow reported → resolved', () => {
    expect(isValidTransition('reported', 'resolved')).toBe(false);
  });

  it('should disallow reported → in_progress', () => {
    expect(isValidTransition('reported', 'in_progress')).toBe(false);
  });

  it('should allow triaged → assigned', () => {
    expect(isValidTransition('triaged', 'assigned')).toBe(true);
  });

  it('should allow assigned → in_progress', () => {
    expect(isValidTransition('assigned', 'in_progress')).toBe(true);
  });

  it('should allow in_progress → resolved', () => {
    expect(isValidTransition('in_progress', 'resolved')).toBe(true);
  });

  it('should allow blocked → any valid state', () => {
    const blockedTargets: IssueStatus[] = VALID_TRANSITIONS['blocked'];
    blockedTargets.forEach((target) => {
      expect(isValidTransition('blocked', target)).toBe(true);
    });
  });

  it('should disallow resolved → any state', () => {
    const allStatuses: IssueStatus[] = ['reported', 'triaged', 'assigned', 'in_progress', 'resolved', 'blocked'];
    allStatuses.forEach((target) => {
      expect(isValidTransition('resolved', target)).toBe(false);
    });
  });
});

describe('VALID_TRANSITIONS', () => {
  it('should have entries for all statuses', () => {
    const statuses: Array<keyof typeof VALID_TRANSITIONS> = ['reported', 'triaged', 'assigned', 'in_progress', 'resolved', 'blocked'];
    statuses.forEach((status) => {
      expect(VALID_TRANSITIONS[status]).toBeDefined();
      expect(Array.isArray(VALID_TRANSITIONS[status])).toBe(true);
    });
  });

  it('should have empty transitions for resolved', () => {
    expect(VALID_TRANSITIONS['resolved']).toEqual([]);
  });

  it('should have at least one transition for all non-resolved statuses', () => {
    const nonResolved: Array<keyof typeof VALID_TRANSITIONS> = ['reported', 'triaged', 'assigned', 'in_progress', 'blocked'];
    nonResolved.forEach((status) => {
      expect(VALID_TRANSITIONS[status].length).toBeGreaterThan(0);
    });
  });
});
