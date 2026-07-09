# Judging Hook

## Why TownOps Skill Scores Well on NandaHack

### Usefulness (High)
- **Real problem**: Municipal issue triage is a genuine operational challenge
- **Structured solution**: Every endpoint solves a specific, concrete problem
- **Measurable impact**: Issues get classified, prioritized, assigned, and tracked
- **Agent-operable**: Autonomous agents can use the service immediately

### Creativity (High)
- **Agent-first design**: Built for autonomous agents, not humans
- **SKILL.md as primary artifact**: The skill definition enables any agent to use the service
- **Hybrid AI/deterministic**: Smart AI for understanding, deterministic logic for reliability
- **Zone-aware operations**: Municipal context makes it realistic and practical

### Easy Setup (High)
- **Single command**: `npm install && npm run dev`
- **SQLite included**: No database setup required
- **Demo data seeded**: Works immediately with realistic issues
- **Environment variable only**: Just add `NIM_API_KEY`

### Agent Usability from SKILL.md Alone (Highest)
- **Complete endpoint reference**: Every endpoint documented with schemas
- **Valid transitions**: State machine is explicit
- **Best practices**: Domain knowledge included
- **Error handling**: Agents know what to expect
- **Example workflow**: End-to-end curl examples

### The Key Differentiator

Most hackathon projects build tools for humans. TownOps Skill builds a service for agents. The SKILL.md isn't documentation — it's the product interface. Any agent that reads it can operate the entire workflow without human guidance.

### What Judges Should Test

1. Read the SKILL.md only
2. Create an issue using the API
3. Classify it
4. Assign it
5. Update status through resolution
6. Generate a resident update
7. Query zone priorities

If an agent can do all this from the SKILL.md alone, the product works as designed.
