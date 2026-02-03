-- Migration: Add system information fields
-- Date: 2026-02-04
-- Description: Adds AE version, language, theme and computer environment information

-- Add columns to ae_status table for system information
ALTER TABLE ae_status ADD COLUMN ae_version TEXT;
ALTER TABLE ae_status ADD COLUMN ae_language TEXT;
ALTER TABLE ae_status ADD COLUMN ae_theme TEXT;
ALTER TABLE ae_status ADD COLUMN os_name TEXT;
ALTER TABLE ae_status ADD COLUMN os_platform TEXT;
ALTER TABLE ae_status ADD COLUMN system_info_json TEXT; -- JSON string for detailed system info

-- Add columns to work_data table for system information
ALTER TABLE work_data ADD COLUMN ae_version TEXT;
ALTER TABLE work_data ADD COLUMN ae_language TEXT;
ALTER TABLE work_data ADD COLUMN ae_theme TEXT;
ALTER TABLE work_data ADD COLUMN os_name TEXT;
ALTER TABLE work_data ADD COLUMN system_info_json TEXT; -- JSON string for detailed system info

-- Update ae_status table schema with JSON columns for better querying
-- The system_info_json will contain:
-- {
--   "ae": {
--     "version": "23.0",
--     "appVersion": "23.0.0",
--     "buildName": "23.0x45",
--     "language": "zh_CN",
--     "theme": "0",
--     "projectOpen": true,
--     "projectName": "My Project",
--     "projectPath": "E:\\Projects\\MyProject.aep"
--   },
--   "system": {
--     "os": "Windows",
--     "platform": "win32",
--     "browser": { "userAgent": "...", "platform": "Win32", "language": "zh-CN", ... },
--     "screen": { "width": 1920, "height": 1080, ... },
--     "window": { "innerWidth": 300, "innerHeight": 400, ... }
--   },
--   "timestamp": "2026-02-04T12:00:00.000Z"
-- }

-- Create indexes for faster queries on system info
CREATE INDEX IF NOT EXISTS idx_ae_status_ae_version ON ae_status(ae_version);
CREATE INDEX IF NOT EXISTS idx_work_data_ae_version ON work_data(ae_version);
CREATE INDEX IF NOT EXISTS idx_ae_status_os_name ON ae_status(os_name);
CREATE INDEX IF NOT EXISTS idx_work_data_os_name ON work_data(os_name);