-- Migration: Add project_id column to ae_status table
-- Date: 2026-01-29
-- Description: Adds project_id field to ae_status table for tracking project identification

-- Add project_id column
ALTER TABLE ae_status ADD COLUMN project_id TEXT;

-- Create index on project_id for faster queries
CREATE INDEX IF NOT EXISTS idx_ae_status_project_id ON ae_status(project_id);