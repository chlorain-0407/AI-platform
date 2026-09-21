-- ============================================================
-- Supabase Schema DDL for Real Estate Platform (房仲工作平台)
-- ============================================================

-- 1. Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. users table
-- id UUID, email text, name text, role text ('admin' | 'agent'), created_at timestamptz
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'agent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. properties table
-- id UUID Primary Key, user_id UUID, title text, community text, address text,
-- price numeric, area numeric, building_age numeric, layout text, floor text,
-- parking text, description text, owner_reason text, created_at timestamptz, updated_at timestamptz
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  community TEXT,
  address TEXT NOT NULL,
  price NUMERIC NOT NULL,
  area NUMERIC NOT NULL,
  building_age NUMERIC DEFAULT 0,
  layout TEXT,
  floor TEXT,
  parking TEXT,
  description TEXT,
  owner_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ai_tools table
-- id UUID, name text, description text, system_prompt text, model text,
-- enabled boolean, created_at timestamptz, updated_at timestamptz
CREATE TABLE IF NOT EXISTS ai_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT,
  model TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ai_runs table
-- id UUID, user_id UUID, property_id UUID, tool_id UUID,
-- input jsonb, output jsonb, model text, created_at timestamptz
CREATE TABLE IF NOT EXISTS ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES ai_tools(id) ON DELETE SET NULL,
  input JSONB,
  output JSONB,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables (allow public reads/writes for service role or anon if policies set)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_runs ENABLE ROW LEVEL SECURITY;

-- Default permissive policies for development/agent use:
CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON users FOR UPDATE USING (true);

CREATE POLICY "Allow public read properties" ON properties FOR SELECT USING (true);
CREATE POLICY "Allow public insert properties" ON properties FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update properties" ON properties FOR UPDATE USING (true);
CREATE POLICY "Allow public delete properties" ON properties FOR DELETE USING (true);

CREATE POLICY "Allow public read ai_tools" ON ai_tools FOR SELECT USING (true);
CREATE POLICY "Allow public insert ai_tools" ON ai_tools FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read ai_runs" ON ai_runs FOR SELECT USING (true);
CREATE POLICY "Allow public insert ai_runs" ON ai_runs FOR INSERT WITH CHECK (true);
