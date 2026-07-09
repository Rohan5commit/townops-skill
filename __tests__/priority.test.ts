import { computePriority } from '../lib/priority';
import type { TownIssue } from '../lib/schemas';

function makeIssue(overrides: Partial<TownIssue> = {}): TownIssue {
  return {
    id: 'test-id-1234',
    title: 'Test issue',
    description: 'Test description for priority scoring',
    type: 'pothole',
    severity: 'medium',
    urgency: 'soon',
    status: 'reported',
    zone: 'downtown',
    location: '123 Main St',
    reportedBy: 'agent',
    assignedTo: null,
    priorityScore: 50,
    affectedResidents: 10,
    isRepeat: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
    tags: [],
    ...overrides,
  };
}

describe('Priority Scoring', () => {
  it('should return a score between 0 and 100', () => {
    const issue = makeIssue();
    const priority = computePriority(issue);
    expect(priority.score).toBeGreaterThanOrEqual(0);
    expect(priority.score).toBeLessThanOrEqual(100);
  });

  it('should score critical severity higher than low', () => {
    const critical = computePriority(makeIssue({ severity: 'critical' }));
    const low = computePriority(makeIssue({ severity: 'low' }));
    expect(critical.score).toBeGreaterThan(low.score);
  });

  it('should score emergency urgency higher than routine', () => {
    const emergency = computePriority(makeIssue({ urgency: 'emergency' }));
    const routine = computePriority(makeIssue({ urgency: 'routine' }));
    expect(emergency.score).toBeGreaterThan(routine.score);
  });

  it('should score high affected residents higher', () => {
    const many = computePriority(makeIssue({ affectedResidents: 200 }));
    const few = computePriority(makeIssue({ affectedResidents: 5 }));
    expect(many.score).toBeGreaterThan(few.score);
  });

  it('should score repeat issues higher', () => {
    const repeat = computePriority(makeIssue({ isRepeat: true }));
    const first = computePriority(makeIssue({ isRepeat: false }));
    expect(repeat.score).toBeGreaterThan(first.score);
  });

  it('should return factors array with correct length', () => {
    const priority = computePriority(makeIssue());
    expect(priority.factors).toHaveLength(6);
  });

  it('should include explanation string', () => {
    const priority = computePriority(makeIssue());
    expect(typeof priority.explanation).toBe('string');
    expect(priority.explanation.length).toBeGreaterThan(0);
  });

  it('should recommend critical for very high scores', () => {
    const issue = makeIssue({
      severity: 'critical',
      urgency: 'emergency',
      affectedResidents: 300,
      isRepeat: true,
      type: 'unsafe_crossing',
    });
    const priority = computePriority(issue);
    expect(priority.recommendedPriority).toBe('critical');
  });

  it('should recommend low for very low scores', () => {
    const issue = makeIssue({
      severity: 'low',
      urgency: 'routine',
      affectedResidents: 0,
      isRepeat: false,
      type: 'graffiti',
    });
    const priority = computePriority(issue);
    expect(priority.recommendedPriority).toBe('low');
  });
});
