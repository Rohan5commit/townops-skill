# TownOps Skill

Agent-usable town operations triage and service coordination for NANDA Town.

## What It Is

TownOps Skill gives autonomous agents a clean, structured way to report, prioritize, assign, and resolve municipal issues through live API endpoints and a comprehensive SKILL.md.

## Why It Fits NandaHack

- **Usefulness**: Solves real municipal operations challenges
- **Creativity**: Agent-first design, not human-first UI
- **Easy Setup**: `npm install && npm run dev` — works immediately
- **Agent Usability**: SKILL.md alone is sufficient for any agent to operate the service

## How the Service Works

```
Report → Triage → Assign → Update → Resolve
```

1. **Report**: Agent creates a structured issue
2. **Triage**: AI classifies type, severity, urgency
3. **Prioritize**: Deterministic scoring with weighted factors
4. **Assign**: Route to correct department with SLA
5. **Update**: Track status transitions with audit log
6. **Resolve**: Generate resident-facing updates

## How Agents Use the SKILL.md

The SKILL.md is the product interface. Any agent that reads it can:

1. Create issues with structured data
2. Classify issues using AI
3. Assign to departments
4. Update status through workflow
5. Generate resident updates
6. Query zone priorities

No human guidance needed. No UI required.

## Phase 1 & Phase 2

### Phase 1 (NANDA Town Contribution)
- Enhanced issue detail component
- Status badges, priority meters, agent actions
- Branch: `hackathon/townops-skill-enhanced-issue-view`

### Phase 2 (TownOps Skill Service)
- 8 live API endpoints
- SKILL.md for agent usability
- AI-powered classification and updates
- Deterministic workflow engine

## Setup

### Prerequisites
- Node.js 18+
- NVIDIA NIM API key

### Installation
```bash
npm install
```

### Environment Variables
```env
# .env.local
NIM_API_KEY=nvapi-your-key-here
```

### Run
```bash
npm run dev
# Open http://localhost:3000
```

### Deploy to Vercel
```bash
npx vercel
# Set NIM_API_KEY in Vercel dashboard
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/issues | Create issue |
| GET | /api/issues | List issues |
| GET | /api/issues?id={id} | Get issue summary |
| POST | /api/issues/{id}/classify | Classify with AI |
| POST | /api/issues/{id}/assign | Assign department |
| POST | /api/issues/{id}/status | Update status |
| GET | /api/zone-priorities | Zone priority summary |
| POST | /api/issues/{id}/resident-update | Generate update |

## Demo Flow

1. Open http://localhost:3000
2. Click "Try Demo"
3. See 10 seeded issues across NANDA Town zones
4. Click "Report Issue" to create a new one
5. Click into any issue to see details, timeline, and actions
6. Use "Move to..." buttons to advance workflow
7. Generate resident-facing updates with AI
8. Visit SKILL.md viewer to see the agent interface
9. Test endpoints in the API Inspector

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Zod (validation)
- SQLite (storage)
- NVIDIA NIM (AI inference)
- Lucide React (icons)

## Project Structure

```
/
├── app/
│   ├── api/
│   │   ├── issues/
│   │   │   ├── route.ts          # POST/GET issues
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts      # GET issue summary
│   │   │   │   ├── classify/     # POST classify
│   │   │   │   ├── assign/       # POST assign
│   │   │   │   ├── status/       # POST update status
│   │   │   │   └── resident-update/  # POST generate update
│   │   │   └── list/route.ts     # GET list with filters
│   │   ├── zone-priorities/route.ts  # GET zone priorities
│   │   └── summary/route.ts      # GET zone summary
│   ├── demo/
│   │   ├── page.tsx              # Issue board
│   │   └── [id]/page.tsx         # Issue detail
│   ├── api-inspector/page.tsx    # API tester
│   ├── skill-viewer/page.tsx     # SKILL.md viewer
│   ├── architecture/page.tsx     # Judge-facing docs
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Styles
├── lib/
│   ├── schemas/index.ts          # Zod schemas
│   ├── db/index.ts               # SQLite database
│   ├── ai/
│   │   ├── nim.ts                # NVIDIA NIM client
│   │   ├── classify.ts           # Issue classification
│   │   ├── resident-update.ts    # Update generator
│   │   └── summary.ts            # Zone summaries
│   ├── issues/index.ts           # Issue service
│   ├── priority/index.ts         # Priority engine
│   ├── assignment/index.ts       # Assignment engine
│   └── utils.ts                  # Utilities
├── docs/
│   ├── skill-design.md
│   ├── phase1-pr.md
│   ├── architecture.md
│   ├── demo-script.md
│   ├── setup.md
│   ├── judging-hook.md
│   ├── prompts-used.md
│   ├── ai-build-log.md
│   └── credits.md
├── SKILL.md                      # Agent interface
├── README.md
└── package.json
```

## Limitations

- SQLite for development; PostgreSQL recommended for production
- AI classification has fallback rules if NIM is unavailable
- No authentication in demo mode
- Single-server deployment (no clustering)

## Future Work

- PostgreSQL with migrations
- Authentication and API keys
- Real-time websockets for live updates
- Mobile-responsive agent dashboard
- Batch issue processing
- Integration with NANDA Town existing systems
- Multi-agent coordination
- SLA tracking and escalation automation

## License

MIT
