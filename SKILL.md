# TownOps Skill

Agent-usable town operations triage and service coordination for NANDA Town.

## Purpose

TownOps Skill gives autonomous agents a clean, structured way to report, prioritize, assign, and resolve municipal issues through live API endpoints. Any agent that reads this SKILL.md can operate the full issue lifecycle without human guidance.

## When to Use This Skill

Use TownOps Skill when you need to:
- Detect or report a town issue (water leak, broken streetlight, pothole, etc.)
- Classify an issue by type, severity, and urgency
- Assign an issue to the correct department
- Track issue status through resolution
- Generate resident-facing update messages
- Query open issues by zone, severity, or department
- Get zone-level priority summaries

## When NOT to Use This Skill

Do NOT use TownOps Skill for:
- Issues outside NANDA Town boundaries
- Personal opinions or commentary
- Tasks unrelated to municipal operations
- Direct communication with residents (use the generated updates instead)
- Making financial transactions or legal decisions

## Base URL

```
http://localhost:3000
```

Replace with your deployed URL in production.

## Authentication

No authentication required for demo. In production, agents should include an `X-Agent-ID` header.

## Endpoints

### 1. Create Issue

```
POST /api/issues
```

Creates a new town issue. The service automatically classifies and prioritizes it.

**Request Body:**
```json
{
  "title": "Water main break on Oak Street",
  "description": "Large water main break causing flooding near 5th Avenue intersection.",
  "type": "water_leak",
  "zone": "downtown",
  "location": "Oak Street & 5th Avenue",
  "reportedBy": "your-agent-id",
  "affectedResidents": 100,
  "tags": ["infrastructure", "safety"]
}
```

**Required Fields:**
- `title` (5-200 chars)
- `description` (10-2000 chars)
- `type`: `water_leak` | `streetlight_outage` | `trash_overflow` | `pothole` | `unsafe_crossing` | `park_maintenance` | `noise_complaint` | `graffiti` | `broken_sidewalk` | `tree_hazard`
- `zone`: `downtown` | `northside` | `southside` | `eastend` | `westend` | `industrial` | `residential_north` | `residential_south` | `park_district` | `waterfront`
- `location` (3-300 chars)

**Response:**
```json
{
  "success": true,
  "issue": { "id": "uuid", "title": "...", "status": "reported", "severity": "high", ... },
  "classification": { "type": "water_leak", "severity": "high", "urgency": "urgent", ... },
  "priority": { "score": 85, "recommendedPriority": "high", ... },
  "nextAction": "triage"
}
```

### 2. List Issues

```
GET /api/issues?status=reported&zone=downtown&limit=10
```

**Query Parameters (all optional):**
- `zone`: Filter by zone
- `status`: `reported` | `triaged` | `assigned` | `in_progress` | `resolved` | `blocked`
- `type`: Filter by issue type
- `severity`: `low` | `medium` | `high` | `critical`
- `limit`: Max results (default 20, max 100)
- `offset`: Pagination offset

**Response:**
```json
{
  "success": true,
  "issues": [...],
  "total": 42,
  "hasMore": true
}
```

### 3. Get Issue Summary

```
GET /api/issues?id={issueId}
```

Returns the issue with full status history and time-open summary.

**Response:**
```json
{
  "success": true,
  "issue": { ... },
  "history": [ { "previousStatus": "reported", "newStatus": "triaged", ... } ],
  "timeOpen": "Open for 12 hours"
}
```

### 4. Classify Issue

```
POST /api/issues/{id}/classify
```

Re-classifies an issue using AI. Returns suggested severity, urgency, department, and reasoning.

**Response:**
```json
{
  "success": true,
  "classification": {
    "type": "water_leak",
    "severity": "critical",
    "urgency": "emergency",
    "suggestedDepartment": "utilities",
    "recommendedSLA": "4 hours",
    "summary": "Critical water main break affecting 100+ residents",
    "reasoning": "High severity due to safety risk and affected population",
    "confidence": 0.92
  }
}
```

### 5. Assign Issue

```
POST /api/issues/{id}/assign
```

Assigns an issue to a department. If no department specified, uses rule-based routing.

**Request Body (optional):**
```json
{
  "department": "utilities"
}
```

**Department Values:**
`public_works` | `utilities` | `parks_rec` | `safety` | `sanitation` | `transportation` | `code_enforcement` | `general`

**Response:**
```json
{
  "success": true,
  "assignment": {
    "department": "utilities",
    "reason": "Based on issue type (water leak), severity (critical), and department expertise.",
    "estimatedResponseTime": "4-12 hours",
    "slaDeadline": "2024-01-15T14:00:00Z",
    "escalationPath": ["Shift Supervisor", "Department Head", "Town Manager"]
  }
}
```

### 6. Update Status

```
POST /api/issues/{id}/status
```

Updates the issue status. Validates state transitions.

**Request Body:**
```json
{
  "status": "triaged",
  "updatedBy": "your-agent-id",
  "note": "Issue assessed as high priority"
}
```

**Status Values:**
`reported` | `triaged` | `assigned` | `in_progress` | `resolved` | `blocked`

**Valid Transitions:**
- `reported` → `triaged`, `blocked`
- `triaged` → `assigned`, `blocked`
- `assigned` → `in_progress`, `blocked`
- `in_progress` → `resolved`, `blocked`
- `resolved` → (none)
- `blocked` → `reported`, `triaged`, `assigned`, `in_progress`

### 7. Get Zone Priorities

```
GET /api/zone-priorities
```

Returns priority summaries for all zones with open issues.

**Response:**
```json
{
  "success": true,
  "zones": [
    {
      "zone": "downtown",
      "totalIssues": 5,
      "openIssues": 4,
      "criticalIssues": 1,
      "avgResponseTime": "< 24 hours",
      "topIssueType": "water_leak",
      "recentIssues": [...]
    }
  ],
  "summary": { "totalZones": 6, "totalOpenIssues": 25, "totalCriticalIssues": 3 }
}
```

### 8. Generate Resident Update

```
POST /api/issues/{id}/resident-update
```

Generates a public-facing update message for the given status.

**Request Body:**
```json
{
  "status": "in_progress"
}
```

**Response:**
```json
{
  "success": true,
  "residentUpdate": {
    "message": "Work is underway to address the water main break on Oak Street. Our utilities team is actively working on a resolution.",
    "status": "in_progress",
    "nextStep": "Our team is actively working on a resolution. We will update you when complete.",
    "estimatedResolution": null,
    "generatedAt": "2024-01-15T10:30:00Z"
  }
}
```

## Priority Scoring

Issues are scored 0-100 using weighted factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| Severity | 30% | Critical=100, High=75, Medium=50, Low=25 |
| Urgency | 25% | Emergency=100, Urgent=75, Soon=50, Routine=25 |
| Public Safety | 15% | Direct safety impact=90, Indirect=65, Limited=35 |
| Affected Residents | 15% | Scale from 10 to 100 based on population |
| Repeat Issue | 10% | Repeat=100, First report=20 |
| Issue Type | 5% | Safety-critical types score higher |

## Best Practices for Issue Reporting

1. **Be specific in titles**: "Water main break on Oak Street" not "Water problem"
2. **Include location details**: Street address, landmarks, intersection
3. **Estimate affected residents**: Helps with prioritization
4. **Use appropriate types**: Correct classification ensures proper department routing
5. **Add tags**: Help categorize and filter issues
6. **Report from the right zone**: Correct zone ensures proper assignment

## How to Choose Priority/Zone Fields

**Zone**: Choose the zone where the issue is located. Use the zone list above. If unsure, use the closest match.

**Severity**: Let the AI classifier determine this, but:
- Critical: Immediate safety risk, active hazards
- High: Significant impact, needs prompt attention
- Medium: Moderate impact, standard response
- Low: Minor issue, routine handling

**Urgency**: Let the AI classifier determine this, but:
- Emergency: Must be addressed within hours
- Urgent: Should be addressed within 24 hours
- Soon: Should be addressed within a few days
- Routine: Standard scheduling

## How to Update Resolution State Safely

1. Always check current status before updating
2. Follow the valid transition rules
3. Add notes explaining the transition
4. Use descriptive `updatedBy` values for audit trails
5. Never skip steps (e.g., don't go from "reported" directly to "resolved")

## Error Handling

All endpoints return errors in this format:
```json
{
  "error": "Error type",
  "message": "Human-readable description",
  "details": { ... }
}
```

Common errors:
- **400**: Invalid request or invalid state transition
- **404**: Issue not found
- **500**: Internal server error

## Example Complete Workflow

```bash
# 1. Report an issue
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -d '{"title":"Streetlight outage on Elm Blvd","description":"Three consecutive streetlights are out","type":"streetlight_outage","zone":"northside","location":"Elm Blvd between Main and Park"}'

# 2. Check the response and get the issue ID, then classify
curl -X POST http://localhost:3000/api/issues/{issueId}/classify

# 3. Assign to department
curl -X POST http://localhost:3000/api/issues/{issueId}/assign \
  -H "Content-Type: application/json" \
  -d '{"department":"public_works"}'

# 4. Update status to in_progress
curl -X POST http://localhost:3000/api/issues/{issueId}/status \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress","note":"Crew dispatched"}'

# 5. Generate resident update
curl -X POST http://localhost:3000/api/issues/{issueId}/resident-update \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}'

# 6. Mark as resolved
curl -X POST http://localhost:3000/api/issues/{issueId}/status \
  -H "Content-Type: application/json" \
  -d '{"status":"resolved","note":"All three streetlights replaced and tested"}'

# 7. Get zone priorities
curl http://localhost:3000/api/zone-priorities

# 8. List all open issues in a zone
curl "http://localhost:3000/api/issues?zone=northside&status=open"
```
