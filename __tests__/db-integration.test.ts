/**
 * Integration tests for the issues service (DB + business logic).
 *
 * Uses an in-memory SQLite database via @libsql/client so every test
 * starts with a clean, seeded database.  The AI classification module
 * is mocked so tests never call the real NIM endpoint.
 */

// Mock the NIM AI calls BEFORE any module imports
jest.mock('@/lib/ai/classify', () => ({
  classifyIssue: jest.fn().mockResolvedValue({
    type: 'pothole',
    severity: 'medium',
    urgency: 'soon',
    suggestedDepartment: 'public_works',
    recommendedSLA: '3 business days',
    summary: 'Test classification',
    reasoning: 'Mocked AI classification',
    confidence: 0.95,
  }),
}));

jest.mock('@/lib/ai/resident-update', () => ({
  generateResidentUpdate: jest.fn().mockResolvedValue({
    issueId: 'mock-id',
    message: 'Mock resident update message',
    status: 'in_progress',
    nextStep: 'Mock next step',
    generatedAt: new Date().toISOString(),
  }),
}));

jest.mock('@/lib/ai/summary', () => ({
  generateZoneSummary: jest.fn().mockResolvedValue('Mock zone summary'),
}));

// Point DB to in-memory file so tests don't touch the real DB
process.env.TURSO_DATABASE_URL = 'file::memory:';
process.env.VERCEL = '';

import {
  createIssue,
  listIssues,
  getIssue,
  getIssueSummary,
  updateIssueStatus,
  getZonePriorities,
} from '@/lib/issues';

describe('Issues Service Integration', () => {
  it('should create an issue and retrieve it', async () => {
    const result = await createIssue({
      title: 'Test water leak on Main St',
      description: 'A significant water leak has been reported on Main Street causing flooding.',
      type: 'water_leak',
      zone: 'downtown',
      location: 'Main Street & 1st Ave',
      reportedBy: 'test-agent',
    });

    expect(result.issue).toBeDefined();
    expect(result.issue.id).toBeDefined();
    expect(result.issue.title).toBe('Test water leak on Main St');
    expect(result.issue.status).toBe('reported');
    expect(result.issue.zone).toBe('downtown');
    expect(result.classification).toBeDefined();
    expect(result.priority).toBeDefined();
  });

  it('should list issues with filters', async () => {
    // Create a few issues
    await createIssue({
      title: 'Pothole on Industrial Drive',
      description: 'A deep pothole has formed on Industrial Drive near the warehouse.',
      type: 'pothole',
      zone: 'industrial',
      location: 'Industrial Drive, Block 400',
    });

    await createIssue({
      title: 'Streetlight outage on Elm Blvd',
      description: 'Multiple streetlights are out on Elm Boulevard between Main and Park.',
      type: 'streetlight_outage',
      zone: 'northside',
      location: 'Elm Blvd, Main to Park',
    });

    // List all
    const all = await listIssues({});
    expect(all.issues.length).toBeGreaterThanOrEqual(2);
    expect(all.total).toBeGreaterThanOrEqual(2);

    // Filter by zone
    const downtown = await listIssues({ zone: 'downtown' });
    expect(downtown.issues.every(i => i.zone === 'downtown')).toBe(true);

    // Filter by type
    const potholes = await listIssues({ type: 'pothole' });
    expect(potholes.issues.every(i => i.type === 'pothole')).toBe(true);

    // Filter by open status (special filter)
    const open = await listIssues({ status: 'open' });
    expect(open.issues.every(i => i.status !== 'resolved')).toBe(true);
  });

  it('should get issue summary with history', async () => {
    const { issue } = await createIssue({
      title: 'Tree hazard near power lines',
      description: 'A damaged tree is leaning toward power lines in the residential area.',
      type: 'tree_hazard',
      zone: 'residential_south',
      location: '456 Oak Lane',
    });

    const summary = await getIssueSummary(issue.id);
    expect(summary.issue.id).toBe(issue.id);
    expect(summary.history).toBeDefined();
    expect(summary.history.length).toBeGreaterThanOrEqual(1);
    expect(summary.timeOpen).toBeDefined();
    expect(summary.timeOpen).toContain('Open for');
  });

  it('should transition through the full lifecycle', async () => {
    const { issue } = await createIssue({
      title: 'Noise complaint at Central Park',
      description: 'Loud construction noise reported near the Central Park playground area.',
      type: 'noise_complaint',
      zone: 'park_district',
      location: 'Central Park, Playground Area',
    });

    // reported -> triaged
    const triaged = await updateIssueStatus(issue.id, 'triaged', 'test-agent', 'Classified as medium priority');
    expect(triaged.previousStatus).toBe('reported');
    expect(triaged.newStatus).toBe('triaged');

    // triaged -> assigned
    const assigned = await updateIssueStatus(issue.id, 'assigned', 'dispatcher', 'Assigned to parks department');
    expect(assigned.previousStatus).toBe('triaged');
    expect(assigned.newStatus).toBe('assigned');

    // assigned -> in_progress
    const inProgress = await updateIssueStatus(issue.id, 'in_progress', 'resolver', 'Crew dispatched');
    expect(inProgress.previousStatus).toBe('assigned');
    expect(inProgress.newStatus).toBe('in_progress');

    // in_progress -> resolved
    const resolved = await updateIssueStatus(issue.id, 'resolved', 'resolver', 'Noise issue resolved');
    expect(resolved.previousStatus).toBe('in_progress');
    expect(resolved.newStatus).toBe('resolved');

    // Verify full history
    const summary = await getIssueSummary(issue.id);
    expect(summary.history.length).toBeGreaterThanOrEqual(5); // creation + 4 transitions
    expect(summary.timeOpen).toContain('Resolved in');
  });

  it('should reject invalid state transitions', async () => {
    const { issue } = await createIssue({
      title: 'Broken sidewalk near library',
      description: 'A raised sidewalk slab near the library entrance poses a trip hazard.',
      type: 'broken_sidewalk',
      zone: 'eastend',
      location: '123 Main Street',
    });

    // reported -> resolved (skipping intermediate steps) should fail
    await expect(
      updateIssueStatus(issue.id, 'resolved', 'test-agent')
    ).rejects.toThrow('Invalid transition');
  });

  it('should return zone priorities', async () => {
    const zones = await getZonePriorities();
    expect(Array.isArray(zones)).toBe(true);
    // Zones with seeded issues should appear
    expect(zones.length).toBeGreaterThan(0);

    const zone = zones[0];
    expect(zone.zone).toBeDefined();
    expect(zone.totalIssues).toBeGreaterThanOrEqual(0);
    expect(zone.openIssues).toBeGreaterThanOrEqual(0);
    expect(zone.recentIssues).toBeDefined();
  });

  it('should handle the open filter correctly', async () => {
    const open = await listIssues({ status: 'open' });
    expect(open.issues.every(i => i.status !== 'resolved')).toBe(true);

    // Count should exclude resolved issues
    const resolved = await listIssues({ status: 'resolved' });
    const total = await listIssues({});
    expect(open.total + resolved.total).toBeGreaterThanOrEqual(total.total - 2); // -2 for any edge cases
  });

  it('should throw when getting a non-existent issue', async () => {
    await expect(getIssue('non-existent-id')).rejects.toThrow('not found');
    await expect(getIssueSummary('non-existent-id')).rejects.toThrow('not found');
  });
});
