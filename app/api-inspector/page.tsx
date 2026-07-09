"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Copy, Check, ChevronDown, ChevronRight } from "lucide-react";

interface Endpoint {
  method: string;
  path: string;
  description: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  requestBody?: { field: string; type: string; required: boolean; description: string }[];
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "POST",
    path: "/api/issues",
    description: "Create a new issue. The service will automatically classify, prioritize, and suggest next actions.",
    params: [],
    requestBody: [
      { field: "title", type: "string", required: true, description: "Issue title (5-200 chars)" },
      { field: "description", type: "string", required: true, description: "Detailed description (10-2000 chars)" },
      { field: "type", type: "IssueType", required: true, description: "water_leak | streetlight_outage | trash_overflow | pothole | unsafe_crossing | park_maintenance | noise_complaint | graffiti | broken_sidewalk | tree_hazard" },
      { field: "zone", type: "Zone", required: true, description: "downtown | northside | southside | eastend | westend | industrial | residential_north | residential_south | park_district | waterfront" },
      { field: "location", type: "string", required: true, description: "Human-readable location" },
      { field: "reportedBy", type: "string", required: false, description: "Agent or reporter identifier" },
      { field: "affectedResidents", type: "number", required: false, description: "Estimated affected residents" },
      { field: "tags", type: "string[]", required: false, description: "Tags for categorization" },
    ],
  },
  {
    method: "GET",
    path: "/api/issues",
    description: "List issues with optional filters. Returns issues sorted by priority score descending.",
    params: [
      { name: "zone", type: "Zone", required: false, description: "Filter by zone" },
      { name: "status", type: "IssueStatus", required: false, description: "Filter by status" },
      { name: "type", type: "IssueType", required: false, description: "Filter by issue type" },
      { name: "severity", type: "Severity", required: false, description: "Filter by severity" },
      { name: "limit", type: "number", required: false, description: "Max results (default 20, max 100)" },
      { name: "offset", type: "number", required: false, description: "Pagination offset" },
    ],
  },
  {
    method: "GET",
    path: "/api/issues?id={issueId}",
    description: "Get a single issue with its full status history and time-open summary.",
    params: [
      { name: "id", type: "UUID", required: true, description: "Issue UUID" },
    ],
  },
  {
    method: "POST",
    path: "/api/issues/{id}/classify",
    description: "Re-classify an issue using AI. Returns suggested type, severity, urgency, and department.",
    params: [
      { name: "id", type: "UUID", required: true, description: "Issue UUID" },
    ],
  },
  {
    method: "POST",
    path: "/api/issues/{id}/assign",
    description: "Assign an issue to a department. If no department specified, uses rule-based routing.",
    requestBody: [
      { field: "department", type: "Department", required: false, description: "Preferred department" },
    ],
    params: [
      { name: "id", type: "UUID", required: true, description: "Issue UUID" },
    ],
  },
  {
    method: "POST",
    path: "/api/issues/{id}/status",
    description: "Update issue status. Validates state transitions. Returns error for invalid transitions.",
    requestBody: [
      { field: "status", type: "IssueStatus", required: true, description: "New status" },
      { field: "updatedBy", type: "string", required: false, description: "Who updated (default: agent)" },
      { field: "note", type: "string", required: false, description: "Optional note" },
    ],
    params: [
      { name: "id", type: "UUID", required: true, description: "Issue UUID" },
    ],
  },
  {
    method: "GET",
    path: "/api/zone-priorities",
    description: "Get priority summary for all zones with open issues. Returns zone stats, critical counts, and top issues.",
    params: [],
  },
  {
    method: "POST",
    path: "/api/issues/{id}/resident-update",
    description: "Generate a resident-facing update message for the given status. Uses AI for natural language, falls back to templates.",
    requestBody: [
      { field: "status", type: "IssueStatus", required: true, description: "Status to generate update for" },
    ],
    params: [
      { name: "id", type: "UUID", required: true, description: "Issue UUID" },
    ],
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-100 text-green-700",
  POST: "bg-blue-100 text-blue-700",
  PUT: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
};

const SAMPLE_REQUESTS: Record<string, string> = {
  "POST /api/issues": JSON.stringify(
    {
      title: "Water main break on Oak Street",
      description: "Large water main break causing flooding on Oak Street near the intersection with 5th Avenue.",
      type: "water_leak",
      zone: "downtown",
      location: "Oak Street & 5th Avenue",
      reportedBy: "agent-patrol",
      affectedResidents: 100,
    },
    null,
    2
  ),
  "GET /api/issues": "/api/issues?status=reported&zone=downtown&limit=5",
  "GET /api/issues?id={issueId}": "/api/issues?id=<uuid>",
  "POST /api/issues/{id}/classify": "/api/issues/<uuid>/classify",
  "POST /api/issues/{id}/assign": JSON.stringify({ department: "utilities" }, null, 2),
  "POST /api/issues/{id}/status": JSON.stringify({ status: "triaged", updatedBy: "agent-001", note: "Classified as high priority" }, null, 2),
  "GET /api/zone-priorities": "/api/zone-priorities",
  "POST /api/issues/{id}/resident-update": JSON.stringify({ status: "in_progress" }, null, 2),
};

export default function ApiInspectorPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: number; body: string }>>({});
  const [testing, setTesting] = useState<string | null>(null);

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(key);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  }

  async function testEndpoint(endpoint: Endpoint) {
    const key = `${endpoint.method} ${endpoint.path}`;
    setTesting(key);

    try {
      if (endpoint.method === "GET" && !endpoint.path.includes("{id}")) {
        const res = await fetch(endpoint.path.replace("{id}", ""));
        const body = await res.text();
        setTestResults((prev) => ({ ...prev, [key]: { status: res.status, body } }));
      } else if (endpoint.method === "POST" && endpoint.path === "/api/issues") {
        const res = await fetch(endpoint.path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Test issue: Broken streetlight",
            description: "A test streetlight outage for API validation.",
            type: "streetlight_outage",
            zone: "downtown",
            location: "Test Location",
          }),
        });
        const body = await res.text();
        setTestResults((prev) => ({ ...prev, [key]: { status: res.status, body } }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [key]: { status: 0, body: "Select a specific issue to test this endpoint." },
        }));
      }
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [key]: { status: 0, body: `Error: ${(err as Error).message}` },
      }));
    } finally {
      setTesting(null);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-semibold">API Inspector</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <p className="text-muted-foreground text-sm mb-6">
          Explore and test the TownOps Skill API endpoints. All endpoints use structured JSON schemas with Zod validation.
        </p>

        <div className="space-y-3">
          {ENDPOINTS.map((ep) => {
            const key = `${ep.method} ${ep.path}`;
            const isOpen = expanded === key;
            const result = testResults[key];
            const sample = SAMPLE_REQUESTS[key];

            return (
              <div key={key} className="border border-border rounded-lg bg-card overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : key)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left"
                >
                  {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${METHOD_COLORS[ep.method]}`}>
                    {ep.method}
                  </span>
                  <code className="text-sm font-mono">{ep.path}</code>
                  <span className="text-xs text-muted-foreground ml-auto hidden md:block">{ep.description.substring(0, 60)}...</span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-border pt-3">
                    <p className="text-sm text-muted-foreground mb-4">{ep.description}</p>

                    {/* Parameters */}
                    {ep.params && ep.params.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Query Parameters</h4>
                        <div className="space-y-1">
                          {ep.params.map((p) => (
                            <div key={p.name} className="flex items-center gap-2 text-sm">
                              <code className="px-1.5 py-0.5 bg-muted rounded text-xs">{p.name}</code>
                              <span className="text-xs text-muted-foreground">{p.type}</span>
                              {p.required && <span className="text-[10px] text-red-600 font-medium">required</span>}
                              <span className="text-xs text-muted-foreground">— {p.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Request Body */}
                    {ep.requestBody && ep.requestBody.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Request Body</h4>
                        <div className="space-y-1">
                          {ep.requestBody.map((f) => (
                            <div key={f.field} className="flex items-center gap-2 text-sm">
                              <code className="px-1.5 py-0.5 bg-muted rounded text-xs">{f.field}</code>
                              <span className="text-xs text-muted-foreground">{f.type}</span>
                              {f.required && <span className="text-[10px] text-red-600 font-medium">required</span>}
                              <span className="text-xs text-muted-foreground">— {f.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sample Request */}
                    {sample && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Example Request</h4>
                          <button
                            onClick={() => copyToClipboard(sample, key)}
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                          >
                            {copiedEndpoint === key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copiedEndpoint === key ? "Copied" : "Copy"}
                          </button>
                        </div>
                        <pre className="p-3 bg-muted rounded-md text-xs overflow-x-auto max-h-40">
                          {sample}
                        </pre>
                      </div>
                    )}

                    {/* Test Button & Result */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => testEndpoint(ep)}
                        disabled={testing === key}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {testing === key ? "Testing..." : "Test"}
                      </button>
                    </div>

                    {result && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">Status:</span>
                          <span className={`px-1.5 py-0.5 text-xs rounded ${result.status >= 200 && result.status < 300 ? "bg-green-100 text-green-700" : result.status === 0 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                            {result.status || "Error"}
                          </span>
                        </div>
                        <pre className="p-3 bg-muted rounded-md text-xs overflow-x-auto max-h-60">
                          {result.body}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
