"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check } from "lucide-react";

export default function SkillViewerPage() {
  const [skillContent, setSkillContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/SKILL.md")
      .then((res) => res.text())
      .then((text) => setSkillContent(text))
      .catch(() => setSkillContent("# SKILL.md not found"))
      .finally(() => setLoading(false));
  }, []);

  function copyToClipboard() {
    navigator.clipboard.writeText(skillContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="font-semibold">SKILL.md</h1>
          </div>
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="p-4 rounded-lg bg-muted/50 border border-border mb-6 text-sm text-muted-foreground">
          This SKILL.md defines how autonomous agents should use the TownOps Skill service.
          Copy this file to make any agent capable of operating the full issue lifecycle.
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading SKILL.md...</div>
        ) : (
          <article className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap bg-card border border-border rounded-lg p-6 text-sm font-mono leading-relaxed overflow-x-auto">
              {skillContent}
            </pre>
          </article>
        )}
      </main>
    </div>
  );
}
