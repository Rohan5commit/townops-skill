import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = path.join(process.cwd(), 'townops.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium',
      urgency TEXT NOT NULL DEFAULT 'routine',
      status TEXT NOT NULL DEFAULT 'reported',
      zone TEXT NOT NULL,
      location TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      reported_by TEXT NOT NULL DEFAULT 'agent',
      assigned_to TEXT,
      priority_score REAL NOT NULL DEFAULT 50,
      affected_residents INTEGER DEFAULT 0,
      is_repeat INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      resolved_at TEXT,
      tags TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS status_history (
      id TEXT PRIMARY KEY,
      issue_id TEXT NOT NULL,
      previous_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      updated_by TEXT NOT NULL,
      note TEXT,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (issue_id) REFERENCES issues(id)
    );

    CREATE TABLE IF NOT EXISTS agent_actions (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      issue_id TEXT,
      agent_id TEXT NOT NULL,
      input TEXT NOT NULL DEFAULT '{}',
      output TEXT NOT NULL DEFAULT '{}',
      success INTEGER NOT NULL DEFAULT 1,
      error TEXT,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (issue_id) REFERENCES issues(id)
    );

    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_issues_zone ON issues(zone);
    CREATE INDEX IF NOT EXISTS idx_issues_type ON issues(type);
    CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
    CREATE INDEX IF NOT EXISTS idx_status_history_issue ON status_history(issue_id);
  `);

  // Seed demo data if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM issues').get() as { count: number };
  if (count.count === 0) {
    seedDemoData(db);
  }
}

function seedDemoData(db: Database.Database) {
  const now = new Date().toISOString();
  const hourAgo = new Date(Date.now() - 3600000).toISOString();
  const dayAgo = new Date(Date.now() - 86400000).toISOString();

  const issues = [
    {
      id: uuidv4(),
      title: 'Water main leak on Oak Street',
      description: 'A significant water main leak has been reported near the intersection of Oak Street and 5th Avenue. Water is pooling in the street and sidewalk area, creating a hazard for pedestrians and vehicles.',
      type: 'water_leak',
      severity: 'critical',
      urgency: 'emergency',
      status: 'in_progress',
      zone: 'downtown',
      location: 'Oak Street & 5th Avenue, Downtown',
      reported_by: 'agent-navigator',
      assigned_to: 'utilities',
      priority_score: 95,
      affected_residents: 150,
      is_repeat: 0,
      created_at: dayAgo,
      updated_at: hourAgo,
      resolved_at: null,
      tags: JSON.stringify(['infrastructure', 'safety', 'water']),
    },
    {
      id: uuidv4(),
      title: 'Multiple streetlight outages on Elm Boulevard',
      description: 'Four consecutive streetlights are out on Elm Boulevard between Main St and Park Ave. This creates a dark corridor at night that residents feel is unsafe.',
      type: 'streetlight_outage',
      severity: 'high',
      urgency: 'urgent',
      status: 'assigned',
      zone: 'northside',
      location: 'Elm Boulevard (Main St to Park Ave), Northside',
      reported_by: 'agent-surveyor',
      assigned_to: 'public_works',
      priority_score: 78,
      affected_residents: 80,
      is_repeat: 1,
      created_at: dayAgo,
      updated_at: hourAgo,
      resolved_at: null,
      tags: JSON.stringify(['lighting', 'safety', 'repeat']),
    },
    {
      id: uuidv4(),
      title: 'Trash bins overflowing at Central Park',
      description: 'Multiple trash bins at Central Park are overflowing, especially near the playground area. This is attracting pests and creating an unsanitary condition for park visitors.',
      type: 'trash_overflow',
      severity: 'medium',
      urgency: 'soon',
      status: 'triaged',
      zone: 'park_district',
      location: 'Central Park Playground Area, Park District',
      reported_by: 'agent-patrol',
      assigned_to: null,
      priority_score: 62,
      affected_residents: 40,
      is_repeat: 0,
      created_at: hourAgo,
      updated_at: hourAgo,
      resolved_at: null,
      tags: JSON.stringify(['sanitation', 'parks']),
    },
    {
      id: uuidv4(),
      title: 'Large pothole on Industrial Drive',
      description: 'A deep pothole approximately 2 feet wide has formed on Industrial Drive near the warehouse district. Multiple vehicle incidents have been reported.',
      type: 'pothole',
      severity: 'high',
      urgency: 'urgent',
      status: 'reported',
      zone: 'industrial',
      location: 'Industrial Drive, Block 400, Industrial District',
      reported_by: 'agent-commuter',
      assigned_to: null,
      priority_score: 72,
      affected_residents: 60,
      is_repeat: 0,
      created_at: hourAgo,
      updated_at: hourAgo,
      resolved_at: null,
      tags: JSON.stringify(['road', 'safety']),
    },
    {
      id: uuidv4(),
      title: 'Unsafe pedestrian crossing at School Zone',
      description: 'The crosswalk signals at the school zone intersection of Maple Ave and 2nd St are malfunctioning. Lights flash irregularly and the countdown timer is broken.',
      type: 'unsafe_crossing',
      severity: 'critical',
      urgency: 'emergency',
      status: 'triaged',
      zone: 'residential_north',
      location: 'Maple Ave & 2nd St, Residential North',
      reported_by: 'agent-school',
      assigned_to: null,
      priority_score: 92,
      affected_residents: 200,
      is_repeat: 0,
      created_at: dayAgo,
      updated_at: hourAgo,
      resolved_at: null,
      tags: JSON.stringify(['school', 'pedestrian', 'safety', 'urgent']),
    },
    {
      id: uuidv4(),
      title: 'Overgrown trees blocking sidewalk on West End',
      description: 'Overgrown trees and branches are blocking the sidewalk on Pine Street in the West End. Wheelchair users and pedestrians are forced to walk in the road.',
      type: 'park_maintenance',
      severity: 'medium',
      urgency: 'soon',
      status: 'reported',
      zone: 'westend',
      location: 'Pine Street, West End',
      reported_by: 'agent-accessibility',
      assigned_to: null,
      priority_score: 55,
      affected_residents: 30,
      is_repeat: 1,
      created_at: hourAgo,
      updated_at: hourAgo,
      resolved_at: null,
      tags: JSON.stringify(['accessibility', 'parks', 'repeat']),
    },
    {
      id: uuidv4(),
      title: 'Storm drain blocked on Southside Avenue',
      description: 'Storm drain is blocked with debris on Southside Avenue near the community center. After recent rain, water is pooling and could cause flooding in adjacent properties.',
      type: 'water_leak',
      severity: 'high',
      urgency: 'urgent',
      status: 'assigned',
      zone: 'southside',
      location: 'Southside Avenue near Community Center',
      reported_by: 'agent-monitor',
      assigned_to: 'public_works',
      priority_score: 80,
      affected_residents: 45,
      is_repeat: 0,
      created_at: dayAgo,
      updated_at: hourAgo,
      resolved_at: null,
      tags: JSON.stringify(['drainage', 'flooding']),
    },
    {
      id: uuidv4(),
      title: 'Graffiti on waterfront promenade wall',
      description: 'Large graffiti tags have appeared on the decorative wall along the waterfront promenade. Multiple panels are affected, impacting the appearance of this popular walking area.',
      type: 'graffiti',
      severity: 'low',
      urgency: 'routine',
      status: 'resolved',
      zone: 'waterfront',
      location: 'Waterfront Promenade, Decorative Wall Section',
      reported_by: 'agent-patrol',
      assigned_to: 'code_enforcement',
      priority_score: 30,
      affected_residents: 10,
      is_repeat: 1,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: dayAgo,
      resolved_at: dayAgo,
      tags: JSON.stringify(['aesthetics', 'code_enforcement']),
    },
    {
      id: uuidv4(),
      title: 'Broken sidewalk slab near East End library',
      description: 'A raised and cracked sidewalk slab near the East End branch library entrance poses a trip hazard. The slab has shifted about 3 inches from its original position.',
      type: 'broken_sidewalk',
      severity: 'medium',
      urgency: 'soon',
      status: 'in_progress',
      zone: 'eastend',
      location: 'East End Library, 123 Main Street',
      reported_by: 'agent-patrol',
      assigned_to: 'public_works',
      priority_score: 58,
      affected_residents: 25,
      is_repeat: 0,
      created_at: dayAgo,
      updated_at: hourAgo,
      resolved_at: null,
      tags: JSON.stringify(['infrastructure', 'accessibility']),
    },
    {
      id: uuidv4(),
      title: 'Damaged tree near residential power lines',
      description: 'A large oak tree in Residential South has a cracked trunk and is leaning toward power lines. High winds could cause it to fall on the lines or adjacent homes.',
      type: 'tree_hazard',
      severity: 'critical',
      urgency: 'emergency',
      status: 'assigned',
      zone: 'residential_south',
      location: '456 Oak Lane, Residential South',
      reported_by: 'agent-safety',
      assigned_to: 'parks_rec',
      priority_score: 90,
      affected_residents: 120,
      is_repeat: 0,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: hourAgo,
      resolved_at: null,
      tags: JSON.stringify(['tree', 'safety', 'utilities']),
    },
  ];

  const insertIssue = db.prepare(`
    INSERT INTO issues (id, title, description, type, severity, urgency, status, zone, location, reported_by, assigned_to, priority_score, affected_residents, is_repeat, created_at, updated_at, resolved_at, tags)
    VALUES (@id, @title, @description, @type, @severity, @urgency, @status, @zone, @location, @reported_by, @assigned_to, @priority_score, @affected_residents, @is_repeat, @created_at, @updated_at, @resolved_at, @tags)
  `);

  const insertHistory = db.prepare(`
    INSERT INTO status_history (id, issue_id, previous_status, new_status, updated_by, note, timestamp)
    VALUES (@id, @issue_id, @previous_status, @new_status, @updated_by, @note, @timestamp)
  `);

  const seedTransaction = db.transaction(() => {
    for (const issue of issues) {
      insertIssue.run(issue);
      insertHistory.run({
        id: uuidv4(),
        issue_id: issue.id,
        previous_status: 'reported',
        new_status: issue.status,
        updated_by: 'system-seed',
        note: 'Initial demo data',
        timestamp: issue.created_at,
      });
    }
  });

  seedTransaction();
}

export function resetDb() {
  if (db) {
    db.close();
    db = null;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
}
