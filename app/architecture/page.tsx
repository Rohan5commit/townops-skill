"use client";

import Link from "next/link";
import { ArrowLeft, Bot, CheckCircle2, Code2, Database, FileText, GitBranch, Layers, Shield, Zap } from "lucide-react";

const SECTIONS = [
  {
    icon: Layers,
    title: "What the Service Does",
    content:
      "TownOps Skill is a structured municipal operations service for NANDA Town. It provides live API endpoints that let autonomous agents report, classify, prioritize, assign, update, and resolve town issues through a deterministic workflow pipeline. The service is designed so that another agent can use it correctly from the SKILL.md alone.",
  },
  {
    icon: Bot,
    title: "Why It's Useful in NANDA Town",
    content:
      "NANDA Town generates many small operational issues — water leaks, broken streetlights, trash overflow, unsafe crossings. The hard part is not just seeing these issues but handling them consistently. TownOps Skill creates a structured service that autonomous agents can operate, ensuring every issue gets classified, prioritized, assigned, and tracked through to resolution.",
  },
  {
    icon: Code2,
    title: "How the Endpoints Work",
    content:
      "The service exposes 8 structured endpoints with strict Zod schema validation. Every request is validated before processing. The workflow follows: create_issue → classify_issue → priority_score → assign_issue → update_status → generate_update. Each endpoint returns predictable JSON with success/error fields and typed data.",
  },
  {
    icon: FileText,
    title: "Why the SKILL.md Is Central",
    content:
      "The SKILL.md is the most important artifact. It's a self-contained instruction document that any autonomous agent can read to understand how to use the entire service. It includes endpoint specifications, input/output formats, error handling, and best practices. This means agents don't need human guidance — they read the SKILL.md and operate the workflow independently.",
  },
  {
    icon: Zap,
    title: "What Is AI-Driven",
    content:
      "AI (via NVIDIA NIM) is used for: issue classification (type, severity, urgency), priority explanation generation, zone summary generation, and resident-facing update drafting. The AI layer adds natural language understanding and communication quality to the structured pipeline.",
  },
  {
    icon: Shield,
    title: "What Is Deterministic",
    content:
      "Workflow state transitions are strictly deterministic. Valid transitions are hardcoded (reported → triaged → assigned → in_progress → resolved). Schema validation is mandatory on every endpoint. Priority scoring uses weighted deterministic factors. If AI fails, fallback rule-based logic ensures the system still works correctly.",
  },
  {
    icon: CheckCircle2,
    title: "Why Another Agent Can Use This Autonomously",
    content:
      "The combination of structured endpoints, strict schemas, the SKILL.md, and deterministic state management means any agent with HTTP capabilities can read the SKILL.md and immediately operate the full workflow. No human instruction needed. No UI required. No ambiguous language. Just structured API calls with predictable responses.",
  },
];

const STACK = [
  { name: "Next.js 15", role: "Framework" },
  { name: "TypeScript", role: "Language" },
  { name: "Tailwind CSS", role: "Styling" },
  { name: "Zod", role: "Schema Validation" },
  { name: "SQLite", role: "Storage" },
  { name: "NVIDIA NIM", role: "AI Inference" },
  { name: "Lucide React", role: "Icons" },
];

const DATA_FLOW = [
  "Agent reads SKILL.md",
  "Agent calls POST /api/issues",
  "Service validates with Zod",
  "AI classifies issue (NVIDIA NIM)",
  "Priority engine scores (deterministic)",
  "Agent calls POST /api/issues/{id}/assign",
  "Assignment engine routes to department",
  "Agent calls POST /api/issues/{id}/status",
  "Status transitions validated",
  "Agent calls POST /api/issues/{id}/resident-update",
  "AI generates resident-facing message",
  "Issue lifecycle complete",
];

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-semibold">Architecture</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Overview */}
        <section className="p-6 rounded-lg border border-border bg-card">
          <h2 className="text-xl font-bold mb-4">System Overview</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            TownOps Skill is a municipal operations service built for NandaHack. It provides a structured API that
            autonomous agents can use to report, triage, assign, and resolve town issues. The system is designed around
            three core principles: structured schemas, deterministic workflows, and agent-first design.
          </p>
        </section>

        {/* Sections */}
        <div className="space-y-4">
          {SECTIONS.map((section) => (
            <div key={section.title} className="p-5 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-3">
                <section.icon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">{section.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        {/* Data Flow */}
        <section className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            Agent Workflow Data Flow
          </h3>
          <div className="space-y-2">
            {DATA_FLOW.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </div>
                <span className="text-sm">{step}</span>
                {idx < DATA_FLOW.length - 1 && (
                  <div className="absolute ml-3 mt-6 w-px h-4 bg-border" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Technology Stack
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STACK.map((item) => (
              <div key={item.name} className="p-3 rounded-md bg-muted/50 border border-border">
                <div className="font-medium text-sm">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.role}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Issue Lifecycle */}
        <section className="p-6 rounded-lg border border-border bg-card">
          <h3 className="font-semibold mb-4">Issue Lifecycle State Machine</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
            {["reported", "triaged", "assigned", "in_progress", "resolved", "blocked"].map((status, idx) => (
              <div key={status}>
                <div className={`p-2 rounded-md border ${
                  status === "resolved" ? "bg-green-50 border-green-200 text-green-700" :
                  status === "blocked" ? "bg-red-50 border-red-200 text-red-700" :
                  "bg-card border-border"
                }`}>
                  {status.replace(/_/g, " ")}
                </div>
                {idx < 5 && idx !== 4 && (
                  <div className="text-muted-foreground mt-1">→</div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Valid transitions are enforced at the API level. Invalid transitions return 400 errors.
          </p>
        </section>
      </main>
    </div>
  );
}
