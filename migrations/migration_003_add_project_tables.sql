-- Migration 003: Add Project Tables for Cross-Day Data Accumulation
-- Date: 2026-01-29
-- Description: Add projects and project_daily_stats tables to support project-level data accumulation

-- Create projects table (项目主表)
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  project_path TEXT,
  first_work_date TEXT NOT NULL,
  last_work_date TEXT NOT NULL,
  total_work_hours REAL DEFAULT 0,
  total_work_days INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create project_daily_stats table (项目每日统计)
CREATE TABLE IF NOT EXISTS project_daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  work_date TEXT NOT NULL,
  work_hours REAL DEFAULT 0,
  accumulated_runtime REAL DEFAULT 0,
  composition_count INTEGER DEFAULT 0,
  layer_count INTEGER DEFAULT 0,
  keyframe_count INTEGER DEFAULT 0,
  effect_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, work_date),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Create indexes for projects table
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_project_id ON projects(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_first_work_date ON projects(first_work_date);
CREATE INDEX IF NOT EXISTS idx_projects_last_work_date ON projects(last_work_date);

-- Create indexes for project_daily_stats table
CREATE INDEX IF NOT EXISTS idx_project_daily_stats_project_id ON project_daily_stats(project_id);
CREATE INDEX IF NOT EXISTS idx_project_daily_stats_work_date ON project_daily_stats(work_date);
CREATE INDEX IF NOT EXISTS idx_project_daily_stats_composite ON project_daily_stats(project_id, work_date);