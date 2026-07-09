# Architecture

## Overall System Architecture

```
┌─────────────────────────────────────────────────┐
│                    Agent Layer                    │
│  (Autonomous agents reading SKILL.md)            │
└─────────────────────┬───────────────────────────┘
                      │ HTTP
┌─────────────────────▼───────────────────────────┐
│              TownOps Skill API                    │
│  ┌─────────────┐  ┌──────────────────────┐      │
│  │ Zod Schema  │  │  Route Handlers       │      │
│  │ Validation  │──│  /api/issues/*        │      │
│  └─────────────┘  │  /api/zone-priorities │      │
│                    │  /api/summary         │      │
│                    └──────────┬───────────┘      │
│                               │                   │
│  ┌────────────────────────────▼──────────────┐   │
│  │            Core Services                   │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ Issues   │ │ Priority │ │Assignment│  │   │
│  │  │ Service  │ │ Engine   │ │ Engine   │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘  │   │
│  └────────────────────────────┬──────────────┘   │
│                               │                   │
│  ┌────────────────────────────▼──────────────┐   │
│  │            AI Layer (NVIDIA NIM)           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │Classify  │ │ Summary  │ │ Resident │  │   │
│  │  │ Engine   │ │ Engine   │ │ Updates  │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘  │   │
│  └───────────────────────────────────────────┘   │
│                               │                   │
│  ┌────────────────────────────▼──────────────┐   │
│  │           SQLite Database                  │   │
│  │  issues | status_history | agent_actions   │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Issue Lifecycle

```
reported → triaged → assigned → in_progress → resolved
    ↓         ↓          ↓           ↓
  blocked   blocked    blocked     blocked
    ↓         ↓          ↓           ↓
  (resume from any valid state)
```

## AI vs Deterministic Logic

### AI-Driven (NVIDIA NIM)
- Issue classification (type, severity, urgency)
- Priority explanation generation
- Zone summary generation
- Resident update message drafting

### Deterministic
- State transition validation
- Priority score calculation (weighted factors)
- Department assignment rules
- Schema validation (Zod)
- Audit trail logging

### Why This Split?
- AI adds natural language quality and understanding
- Deterministic logic ensures reliability and auditability
- System works even when AI is unavailable (fallback rules)
- No AI output can corrupt workflow state

## Endpoint Design

All endpoints follow consistent patterns:
- `POST` for creating/updating resources
- `GET` for querying resources
- Always return `{ success: boolean, ...data }` or `{ error: string, message: string }`
- Zod validation on all inputs
- Structured JSON responses with predictable schemas
