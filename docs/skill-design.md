# Skill Design

## Why the SKILL.md Is Structured This Way

The SKILL.md is the primary artifact for agent usability. It's structured to give an autonomous agent everything it needs to operate the service without human guidance.

### Structure Choices

1. **Purpose Section**: Agents need to understand *why* they'd use this skill before diving into details
2. **When to Use / Not Use**: Prevents misuse and scope creep
3. **Endpoint Reference**: Each endpoint is documented with method, path, request body, and response format
4. **Schema Definitions**: Complete enum values so agents never guess at valid inputs
5. **Workflow Examples**: End-to-end curl examples showing the full lifecycle
6. **Error Handling**: Agents need to know what errors look like to handle them gracefully
7. **Best Practices**: Domain knowledge that helps agents make better decisions

### How Agents Should Use Each Endpoint

| Step | Endpoint | Purpose | When |
|------|----------|---------|------|
| 1 | POST /api/issues | Report new issue | Agent discovers a problem |
| 2 | POST /api/issues/{id}/classify | Classify issue | Need AI-powered categorization |
| 3 | POST /api/issues/{id}/assign | Assign department | After classification or triage |
| 4 | POST /api/issues/{id}/status | Update status | When work progresses or completes |
| 5 | POST /api/issues/{id}/resident-update | Generate update | Before communicating with residents |
| 6 | GET /api/issues | List issues | Need to see what's open |
| 7 | GET /api/zone-priorities | Zone overview | Need area-level priorities |
| 8 | GET /api/issues?id={id} | Issue details | Need full history and context |

### Failure Cases

- **Invalid state transition**: Returns 400 with valid transitions
- **Issue not found**: Returns 404
- **AI unavailable**: Falls back to rule-based classification
- **Malformed request**: Returns 400 with Zod validation errors

### Agent Decision Patterns

**Reporting pattern**: Agent detects issue → creates report → service auto-classifies → agent assigns → agent updates status as work progresses

**Monitoring pattern**: Agent calls list or zone-priorities → identifies critical issues → takes action on highest priority items

**Communication pattern**: Agent updates issue status → generates resident update → publishes to relevant channel
