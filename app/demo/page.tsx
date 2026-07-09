"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Shield,
  XCircle,
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
  priorityScore: number;
  affectedResidents: number;
  isRepeat: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

const STATUS_COLORS: Record<string, string> = {
  reported: "bg-blue-100 text-blue-700",
  triaged: "bg-purple-100 text-purple-700",
  assigned: "bg-indigo-100 text-indigo-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
  blocked: "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  reported: <Clock className="w-3.5 h-3.5" />,
  triaged: <Search className="w-3.5 h-3.5" />,
  assigned: <MapPin className="w-3.5 h-3.5" />,
  in_progress: <RefreshCw className="w-3.5 h-3.5" />,
  resolved: <CheckCircle2 className="w-3.5 h-3.5" />,
  blocked: <XCircle className="w-3.5 h-3.5" />,
};

const TYPE_LABELS: Record<string, string> = {
  water_leak: "💧 Water Leak",
  streetlight_outage: "💡 Streetlight Outage",
  trash_overflow: "🗑️ Trash Overflow",
  pothole: "🕳️ Pothole",
  unsafe_crossing: "⚠️ Unsafe Crossing",
  park_maintenance: "🌳 Park Maintenance",
  noise_complaint: "🔊 Noise Complaint",
  graffiti: "🎨 Graffiti",
  broken_sidewalk: "🚶 Broken Sidewalk",
  tree_hazard: "🌲 Tree Hazard",
};

const ZONE_LABELS: Record<string, string> = {
  downtown: "Downtown",
  northside: "Northside",
  southside: "Southside",
  eastend: "East End",
  westend: "West End",
  industrial: "Industrial",
  residential_north: "Residential North",
  residential_south: "Residential South",
  park_district: "Park District",
  waterfront: "Waterfront",
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

export default function DemoPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterZone, setFilterZone] = useState<string>("");
  const [filterSeverity, setFilterSeverity] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [creatingIssue, setCreatingIssue] = useState(false);
  const [newIssue, setNewIssue] = useState({
    title: "",
    description: "",
    type: "pothole" as string,
    zone: "downtown" as string,
    location: "",
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, [filterStatus, filterZone, filterSeverity]);

  async function fetchIssues() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterZone) params.set("zone", filterZone);
    if (filterSeverity) params.set("severity", filterSeverity);

    try {
      const res = await fetch(`/api/issues?${params.toString()}`);
      const data = await res.json();
      setIssues(data.issues || []);
    } catch {
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }

  async function createIssue() {
    if (!newIssue.title || !newIssue.description || !newIssue.location) return;
    setCreatingIssue(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIssue),
      });
      if (res.ok) {
        setShowCreateForm(false);
        setNewIssue({ title: "", description: "", type: "pothole", zone: "downtown", location: "" });
        fetchIssues();
      }
    } finally {
      setCreatingIssue(false);
    }
  }

  const openIssues = issues.filter((i) => i.status !== "resolved");
  const resolvedIssues = issues.filter((i) => i.status === "resolved");
  const criticalCount = openIssues.filter((i) => i.severity === "critical").length;
  const highCount = openIssues.filter((i) => i.severity === "high").length;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="font-semibold">Issue Board</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
            </button>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              Report Issue
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-lg bg-card border border-border">
            <div className="text-2xl font-bold">{openIssues.length}</div>
            <div className="text-xs text-muted-foreground">Open Issues</div>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border">
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border">
            <div className="text-2xl font-bold text-orange-600">{highCount}</div>
            <div className="text-xs text-muted-foreground">High Priority</div>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border">
            <div className="text-2xl font-bold text-green-600">{resolvedIssues.length}</div>
            <div className="text-xs text-muted-foreground">Resolved</div>
          </div>
        </div>

        {/* Create Issue Form */}
        {showCreateForm && (
          <div className="mb-6 p-5 rounded-lg border border-primary/30 bg-card">
            <h3 className="font-semibold mb-4">Report New Issue</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Issue title (e.g., Water leak on Main St)"
                value={newIssue.title}
                onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                className="px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <select
                value={newIssue.type}
                onChange={(e) => setNewIssue({ ...newIssue, type: e.target.value })}
                className="px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <textarea
                placeholder="Describe the issue in detail..."
                value={newIssue.description}
                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                rows={3}
                className="px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 md:col-span-2"
              />
              <select
                value={newIssue.zone}
                onChange={(e) => setNewIssue({ ...newIssue, zone: e.target.value })}
                className="px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {Object.entries(ZONE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Location description (e.g., 123 Main St)"
                value={newIssue.location}
                onChange={(e) => setNewIssue({ ...newIssue, location: e.target.value })}
                className="px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createIssue}
                disabled={creatingIssue || !newIssue.title || !newIssue.description || !newIssue.location}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {creatingIssue ? "Creating..." : "Report Issue"}
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 p-4 rounded-lg border border-border bg-card flex flex-wrap gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-sm border border-border rounded-md bg-background"
            >
              <option value="">All Statuses</option>
              <option value="reported">Reported</option>
              <option value="triaged">Triaged</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="blocked">Blocked</option>
            </select>
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="px-3 py-1.5 text-sm border border-border rounded-md bg-background"
            >
              <option value="">All Zones</option>
              {Object.entries(ZONE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-1.5 text-sm border border-border rounded-md bg-background"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button
              onClick={() => { setFilterStatus(""); setFilterZone(""); setFilterSeverity(""); }}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Issues List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading issues...</div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No issues found.</div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => (
              <Link
                key={issue.id}
                href={`/demo/${issue.id}`}
                className="block p-4 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm truncate">{issue.title}</h3>
                      {issue.isRepeat && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-orange-100 text-orange-700 rounded">
                          REPEAT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{issue.description}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{TYPE_LABELS[issue.type] || issue.type}</span>
                      <span>•</span>
                      <span>{ZONE_LABELS[issue.zone] || issue.zone}</span>
                      <span>•</span>
                      <span>{issue.location}</span>
                      {issue.assignedTo && (
                        <>
                          <span>•</span>
                          <span>{DEPT_LABELS[issue.assignedTo] || issue.assignedTo}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${SEVERITY_COLORS[issue.severity] || ""}`}>
                      {issue.severity.toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[issue.status] || ""}`}>
                      {STATUS_ICONS[issue.status]}
                      {issue.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Score: {issue.priorityScore}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
