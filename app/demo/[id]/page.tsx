"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  MessageSquare,
  RefreshCw,
  Shield,
  User,
  Zap,
} from "lucide-react";

interface Issue {
  id: string;
  title: string;
  description: string;
  type: string;
  severity: string;
  urgency: string;
  status: string;
  zone: string;
  location: string;
  assignedTo: string | null;
  reportedBy: string;
  priorityScore: number;
  affectedResidents: number;
  isRepeat: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  tags: string[];
}

interface HistoryEntry {
  issueId: string;
  previousStatus: string;
  newStatus: string;
  updatedBy: string;
  note: string | null;
  timestamp: string;
}

interface SummaryData {
  issue: Issue;
  history: HistoryEntry[];
  timeOpen: string;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  reported: ["triaged", "blocked"],
  triaged: ["assigned", "blocked"],
  assigned: ["in_progress", "blocked"],
  in_progress: ["resolved", "blocked"],
  resolved: [],
  blocked: ["reported", "triaged", "assigned", "in_progress"],
};

const STATUS_LABELS: Record<string, string> = {
  reported: "Reported",
  triaged: "Triaged",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  blocked: "Blocked",
};

const STATUS_COLORS: Record<string, string> = {
  reported: "bg-blue-100 text-blue-700",
  triaged: "bg-purple-100 text-purple-700",
  assigned: "bg-indigo-100 text-indigo-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
  blocked: "bg-red-100 text-red-700",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

const DEPT_LABELS: Record<string, string> = {
  public_works: "Public Works",
  utilities: "Utilities",
  parks_rec: "Parks & Rec",
  safety: "Safety",
  sanitation: "Sanitation",
  transportation: "Transportation",
  code_enforcement: "Code Enforcement",
  general: "General",
};

export default function IssueDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [residentUpdate, setResidentUpdate] = useState<string | null>(null);
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  useEffect(() => {
    fetchIssue();
  }, [id]);

  async function fetchIssue() {
    setLoading(true);
    try {
      const res = await fetch(`/api/issues/${id}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function transitionStatus(newStatus: string, note?: string) {
    setUpdating(true);
    try {
      await fetch(`/api/issues/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, updatedBy: "demo-agent", note }),
      });
      await fetchIssue();
    } finally {
      setUpdating(false);
    }
  }

  async function generateResidentUpdate() {
    setLoadingUpdate(true);
    try {
      const res = await fetch(`/api/issues/${id}/resident-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: data?.issue.status }),
      });
      const json = await res.json();
      setResidentUpdate(json.residentUpdate?.message || "Update generation failed.");
    } catch {
      setResidentUpdate("Failed to generate update.");
    } finally {
      setLoadingUpdate(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading issue details...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Issue not found.
      </div>
    );
  }

  const { issue, history, timeOpen } = data;
  const nextStatuses = VALID_TRANSITIONS[issue.status] || [];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/demo" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-semibold text-sm truncate">{issue.title}</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Issue Info */}
            <div className="p-5 rounded-lg border border-border bg-card">
              <div className="flex items-start justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold">{issue.title}</h2>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${SEVERITY_COLORS[issue.severity]}`}>
                    {issue.severity.toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[issue.status]}`}>
                    {STATUS_LABELS[issue.status]}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{issue.description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Zone:</span>{" "}
                  <span className="font-medium">{issue.zone.replace(/_/g, " ")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>{" "}
                  <span className="font-medium">{issue.location}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>{" "}
                  <span className="font-medium">{issue.type.replace(/_/g, " ")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Priority Score:</span>{" "}
                  <span className="font-medium">{issue.priorityScore}/100</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Affected Residents:</span>{" "}
                  <span className="font-medium">{issue.affectedResidents}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Reported By:</span>{" "}
                  <span className="font-medium">{issue.reportedBy}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Department:</span>{" "}
                  <span className="font-medium">{issue.assignedTo ? DEPT_LABELS[issue.assignedTo] : "Unassigned"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>{" "}
                  <span className="font-medium">{timeOpen}</span>
                </div>
              </div>
              {issue.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {issue.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            {nextStatuses.length > 0 && (
              <div className="p-5 rounded-lg border border-primary/20 bg-card">
                <h3 className="font-semibold text-sm mb-3">Agent Actions</h3>
                <div className="flex flex-wrap gap-2">
                  {nextStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => transitionStatus(status)}
                      disabled={updating}
                      className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {updating ? "Updating..." : `Move to ${STATUS_LABELS[status]}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Resident Update Generator */}
            <div className="p-5 rounded-lg border border-border bg-card">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                Resident Update Generator
              </h3>
              <button
                onClick={generateResidentUpdate}
                disabled={loadingUpdate}
                className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
              >
                {loadingUpdate ? "Generating..." : "Generate Resident Update"}
              </button>
              {residentUpdate && (
                <div className="mt-3 p-3 rounded-md bg-muted text-sm">
                  {residentUpdate}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="p-5 rounded-lg border border-border bg-card">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Status Timeline
              </h3>
              <div className="space-y-3">
                {history.map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-primary" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`px-1.5 py-0.5 text-xs rounded ${STATUS_COLORS[entry.previousStatus]}`}>
                          {STATUS_LABELS[entry.previousStatus]}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className={`px-1.5 py-0.5 text-xs rounded ${STATUS_COLORS[entry.newStatus]}`}>
                          {STATUS_LABELS[entry.newStatus]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          by {entry.updatedBy}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                      {entry.note && (
                        <div className="text-xs text-muted-foreground mt-1 italic">{entry.note}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-semibold text-sm mb-3">Quick Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID</span>
                  <span className="font-mono text-xs">{issue.id.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Urgency</span>
                  <span className="font-medium capitalize">{issue.urgency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Repeat</span>
                  <span className="font-medium">{issue.isRepeat ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="text-xs">{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-semibold text-sm mb-3">API Endpoints</h3>
              <div className="space-y-1.5 text-xs">
                <code className="block px-2 py-1 rounded bg-muted">GET /api/issues/{id.substring(0, 8)}</code>
                <code className="block px-2 py-1 rounded bg-muted">POST /api/issues/{id.substring(0, 8)}/status</code>
                <code className="block px-2 py-1 rounded bg-muted">POST /api/issues/{id.substring(0, 8)}/classify</code>
                <code className="block px-2 py-1 rounded bg-muted">POST /api/issues/{id.substring(0, 8)}/assign</code>
                <code className="block px-2 py-1 rounded bg-muted">POST /api/issues/{id.substring(0, 8)}/resident-update</code>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
