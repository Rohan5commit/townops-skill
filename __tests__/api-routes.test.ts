/**
 * Integration tests for API routes.
 *
 * Mocks the AI modules and uses an in-memory SQLite database.
 * Tests the actual route handlers by simulating NextRequest/NextResponse.
 */

// Mock the NIM AI calls
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

// Point DB to in-memory
process.env.TURSO_DATABASE_URL = 'file::memory:';
process.env.VERCEL = '';

import { NextRequest } from 'next/server';
import { GET as GETIssues, POST as POSTIssues } from '@/app/api/issues/route';
import { GET as GETIssueDetail } from '@/app/api/issues/[id]/route';
import { POST as POSTStatus } from '@/app/api/issues/[id]/status/route';
import { GET as GETZonePriorities } from '@/app/api/zone-priorities/route';

function makeRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(url, options);
}

describe('API Route Integration', () => {
  let createdIssueId: string;

  it('POST /api/issues — should create an issue', async () => {
    const req = makeRequest('http://localhost/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Water main break on Oak Street',
        description: 'Large water main break causing flooding near 5th Avenue intersection.',
        type: 'water_leak',
        zone: 'downtown',
        location: 'Oak Street & 5th Avenue',
      }),
    });

    const res = await POSTIssues(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.issue).toBeDefined();
    expect(data.issue.id).toBeDefined();
    expect(data.classification).toBeDefined();
    expect(data.priority).toBeDefined();
    createdIssueId = data.issue.id;
  });

  it('POST /api/issues — should reject invalid input', async () => {
    const req = makeRequest('http://localhost/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'No', // too short
        description: 'Short', // too short
      }),
    });

    const res = await POSTIssues(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });

  it('GET /api/issues — should list issues', async () => {
    const req = makeRequest('http://localhost/api/issues');
    const res = await GETIssues(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.issues).toBeDefined();
    expect(Array.isArray(data.issues)).toBe(true);
    expect(data.total).toBeGreaterThan(0);
  });

  it('GET /api/issues?status=open — should filter open issues', async () => {
    const req = makeRequest('http://localhost/api/issues?status=open');
    const res = await GETIssues(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.issues.every((i: { status: string }) => i.status !== 'resolved')).toBe(true);
  });

  it('GET /api/issues/[id] — should get issue detail with history', async () => {
    const req = makeRequest(`http://localhost/api/issues/${createdIssueId}`);
    // Simulate Next.js params
    const params = Promise.resolve({ id: createdIssueId });
    const res = await GETIssueDetail(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.issue).toBeDefined();
    expect(data.issue.id).toBe(createdIssueId);
    expect(data.history).toBeDefined();
    expect(Array.isArray(data.history)).toBe(true);
    expect(data.timeOpen).toBeDefined();
  });

  it('GET /api/issues/[id] — should 404 for non-existent issue', async () => {
    const req = makeRequest('http://localhost/api/issues/non-existent');
    const params = Promise.resolve({ id: 'non-existent' });
    const res = await GETIssueDetail(req, { params });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Issue not found');
  });

  it('POST /api/issues/[id]/status — should update status', async () => {
    const req = makeRequest(`http://localhost/api/issues/${createdIssueId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'triaged',
        updatedBy: 'test-agent',
        note: 'Issue classified',
      }),
    });

    const params = Promise.resolve({ id: createdIssueId });
    const res = await POSTStatus(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.update).toBeDefined();
  });

  it('POST /api/issues/[id]/status — should reject invalid transition', async () => {
    const req = makeRequest(`http://localhost/api/issues/${createdIssueId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'resolved', // can't go from triaged -> resolved directly
        updatedBy: 'test-agent',
      }),
    });

    const params = Promise.resolve({ id: createdIssueId });
    const res = await POSTStatus(req, { params });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Status update failed');
  });

  it('GET /api/zone-priorities — should return zone summaries', async () => {
    const req = makeRequest('http://localhost/api/zone-priorities');
    const res = await GETZonePriorities(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.zones).toBeDefined();
    expect(Array.isArray(data.zones)).toBe(true);
    expect(data.summary).toBeDefined();
    expect(data.summary.totalZones).toBeGreaterThanOrEqual(0);
  });
});
