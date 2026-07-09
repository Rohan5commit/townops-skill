import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Code2,
  FileText,
  MapPin,
  Shield,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: Bot,
    title: "Agent-First Design",
    desc: "Structured endpoints that autonomous agents can call directly. No UI-only workflows.",
  },
  {
    icon: Zap,
    title: "Automatic Triage",
    desc: "AI-powered classification of severity, urgency, and department routing with deterministic safeguards.",
  },
  {
    icon: MapPin,
    title: "Zone-Aware",
    desc: "Issues tracked across NANDA Town zones with priority scoring and department assignment.",
  },
  {
    icon: Shield,
    title: "Deterministic State",
    desc: "Strict workflow transitions: report → triage → assign → update → resolve. No corruption possible.",
  },
  {
    icon: Code2,
    title: "Live API",
    desc: "8 structured endpoints with Zod validation, consistent schemas, and machine-readable outputs.",
  },
  {
    icon: FileText,
    title: "SKILL.md Driven",
    desc: "A comprehensive skill definition that lets any agent use the entire service autonomously.",
  },
];

const WORKFLOW = [
  { step: "1", label: "Report", desc: "Agent creates an issue with structured data" },
  { step: "2", label: "Classify", desc: "AI categorizes type, severity, urgency" },
  { step: "3", label: "Prioritize", desc: "Deterministic scoring with weighted factors" },
  { step: "4", label: "Assign", desc: "Route to correct department with SLA" },
  { step: "5", label: "Update", desc: "Track status transitions with audit log" },
  { step: "6", label: "Resolve", desc: "Generate resident-facing updates" },
];

const STATS = [
  { value: "10", label: "Issue Types" },
  { value: "6", label: "Status States" },
  { value: "8", label: "API Endpoints" },
  { value: "10", label: "Town Zones" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            <span className="font-semibold text-lg">TownOps Skill</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link href="/demo" className="px-3 py-1.5 text-sm rounded-md hover:bg-accent transition-colors">Demo</Link>
            <Link href="/api-inspector" className="px-3 py-1.5 text-sm rounded-md hover:bg-accent transition-colors">API</Link>
            <Link href="/skill-viewer" className="px-3 py-1.5 text-sm rounded-md hover:bg-accent transition-colors">SKILL.md</Link>
            <Link href="/architecture" className="px-3 py-1.5 text-sm rounded-md hover:bg-accent transition-colors">Architecture</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Bot className="w-4 h-4" />
            Built for NandaHack 2026
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            TownOps Skill
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Agent-usable town operations triage and service coordination for NANDA Town.
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-8">
            A live service plus SKILL.md that lets autonomous agents detect, report, prioritize,
            assign, and resolve town issues with minimal human handholding.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Try Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/skill-viewer"
              className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
            >
              <FileText className="w-4 h-4" />
              View SKILL.md
            </Link>
            <Link
              href="/api-inspector"
              className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
            >
              <Code2 className="w-4 h-4" />
              API Workflow
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Core Workflow</h2>
          <p className="text-center text-muted-foreground mb-10">
            From agent report to resolution — a structured, auditable pipeline.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {WORKFLOW.map((w) => (
              <div key={w.step} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                  {w.step}
                </div>
                <div>
                  <div className="font-semibold text-sm">{w.label}</div>
                  <div className="text-sm text-muted-foreground">{w.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Why TownOps Skill</h2>
          <p className="text-center text-muted-foreground mb-10">
            Purpose-built for autonomous agent operation with deterministic safeguards.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-5 rounded-lg border border-border bg-background">
                <f.icon className="w-5 h-5 text-primary mb-3" />
                <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to See It Work?</h2>
          <p className="text-muted-foreground mb-6">
            The demo shows real issues being created, classified, assigned, and resolved
            through the structured API — all driven by the SKILL.md.
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Launch Demo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div>TownOps Skill — NandaHack Project</div>
          <div className="flex items-center gap-4">
            <Link href="/skill-viewer" className="hover:text-foreground transition-colors">SKILL.md</Link>
            <Link href="/api-inspector" className="hover:text-foreground transition-colors">API</Link>
            <Link href="/architecture" className="hover:text-foreground transition-colors">Architecture</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
