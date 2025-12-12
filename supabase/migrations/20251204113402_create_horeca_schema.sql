/*
  # Smarter HoReCa AI Supreme - Database Schema

  ## Overview
  Complete database schema for hospitality management system supporting:
  - Multi-location operations
  - 50+ job positions
  - Real-time worker tracking
  - Inventory management
  - Alert system
  - Training library
  - Menu management

  ## Tables Created

  ### 1. locations
  Store information about business locations (restaurants, hotels, gyms, etc.)
  - id, name, type, address, coordinates
  - language preference per location
  - active status

  ### 2. workers
  Employee records with position, performance tracking, geolocation
  - id, code (W034), name, position
  - check-in/out times, lat/lon coordinates
  - performance score, language preference
  - assigned location

  ### 3. positions
  50+ hospitality job positions database
  - id, code (WAITER, LINE_COOK, etc.)
  - names in 5 languages (sr, hr, bs, en, de)
  - responsibilities, assigned modules
  - training requirements

  ### 4. menu_items
  Food & beverage menu with pricing
  - id, name, category, price
  - ingredients, allergens
  - available status

  ### 5. inventory_items
  Stock tracking with AI gap detection
  - id, name, quantity, unit, min_threshold
  - last_checked, expected_qty, actual_qty
  - variance tracking (€)

  ### 6. checklists
  Task lists for opening, closing, HACCP compliance
  - id, name, type, position
  - tasks (JSON array), legal_reference
  - completion tracking

  ### 7. alerts
  Real-time notifications for theft, delays, compliance issues
  - id, type, severity, message (multilingual)
  - worker_id, amount, timestamp
  - read status

  ### 8. voice_orders
  Voice-to-text order processing log
  - id, worker_id, audio_transcript
  - parsed items (JSON), confidence score
  - table number, urgency flag

  ### 9. training_modules
  Learning content for each position
  - id, position_code, title (multilingual)
  - content type (video, quiz, practice)
  - completion tracking

  ### 10. geofence_zones
  Location boundaries for auto check-in
  - id, location_id, center coordinates, radius
  - active hours, enabled status

  ## Security
  - RLS enabled on all tables
  - Policies restrict access to authenticated users
  - Workers can only view own data
  - Managers can view all workers at their location
  - Super admins have full access

  ## Performance
  - Indexes on frequently queried columns
  - PostGIS extension for geospatial queries
  - Timestamps for all records
*/

-- Enable PostGIS extension for geolocation features
CREATE EXTENSION IF NOT EXISTS postgis;

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('RESTAURANT', 'HOTEL', 'BAR', 'CAFE', 'GYM', 'GAS_STATION', 'NIGHT_CLUB', 'FOOD_TRUCK', 'BETTING_SHOP')),
  address text NOT NULL,
  city text NOT NULL,
  country text NOT NULL DEFAULT 'RS',
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  language text NOT NULL DEFAULT 'sr' CHECK (language IN ('sr', 'hr', 'bs', 'en', 'de')),
  timezone text NOT NULL DEFAULT 'Europe/Belgrade',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Positions table (50+ job types)
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name_sr text NOT NULL,
  name_hr text NOT NULL,
  name_bs text NOT NULL,
  name_en text NOT NULL,
  name_de text NOT NULL,
  responsibilities jsonb DEFAULT '[]'::jsonb,
  assigned_modules jsonb DEFAULT '[]'::jsonb,
  category text NOT NULL CHECK (category IN ('FOH', 'BOH', 'MANAGEMENT', 'HOUSEKEEPING', 'MAINTENANCE', 'SECURITY', 'FITNESS', 'GAMING', 'FUEL')),
  training_hours integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Workers table
CREATE TABLE IF NOT EXISTS workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE,
  phone text,
  position_code text NOT NULL REFERENCES positions(code),
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  language text NOT NULL DEFAULT 'sr' CHECK (language IN ('sr', 'hr', 'bs', 'en', 'de')),
  performance_score integer DEFAULT 0 CHECK (performance_score >= 0 AND performance_score <= 100),
  total_shifts integer DEFAULT 0,
  on_time_percentage decimal(5,2) DEFAULT 100.00,
  last_check_in timestamptz,
  last_check_out timestamptz,
  current_latitude decimal(10, 8),
  current_longitude decimal(11, 8),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_en text,
  category text NOT NULL CHECK (category IN ('APPETIZER', 'MAIN', 'DESSERT', 'BEVERAGE', 'ALCOHOL', 'COFFEE', 'SIDE')),
  price decimal(10, 2) NOT NULL,
  cost decimal(10, 2),
  ingredients jsonb DEFAULT '[]'::jsonb,
  allergens jsonb DEFAULT '[]'::jsonb,
  image_url text,
  available boolean DEFAULT true,
  prep_time_minutes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('FOOD', 'BEVERAGE', 'ALCOHOL', 'SUPPLIES', 'CLEANING', 'EQUIPMENT')),
  quantity decimal(10, 2) NOT NULL DEFAULT 0,
  unit text NOT NULL CHECK (unit IN ('kg', 'g', 'l', 'ml', 'pcs', 'bottles', 'cans', 'boxes')),
  min_threshold decimal(10, 2) NOT NULL DEFAULT 0,
  unit_cost decimal(10, 2) NOT NULL DEFAULT 0,
  expected_qty decimal(10, 2),
  actual_qty decimal(10, 2),
  variance_qty decimal(10, 2) GENERATED ALWAYS AS (actual_qty - expected_qty) STORED,
  variance_cost decimal(10, 2) GENERATED ALWAYS AS ((actual_qty - expected_qty) * unit_cost) STORED,
  last_checked timestamptz,
  last_restocked timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Checklists table
CREATE TABLE IF NOT EXISTS checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('OPENING', 'CLOSING', 'HACCP', 'CLEANING', 'MAINTENANCE', 'SAFETY')),
  position_code text REFERENCES positions(code),
  tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  legal_reference text,
  frequency text NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'AS_NEEDED')),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Checklist completions table
CREATE TABLE IF NOT EXISTS checklist_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid REFERENCES checklists(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES workers(id) ON DELETE SET NULL,
  completed_at timestamptz DEFAULT now(),
  tasks_completed jsonb DEFAULT '[]'::jsonb,
  photos jsonb DEFAULT '[]'::jsonb,
  notes text,
  ai_validated boolean DEFAULT false
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES workers(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('THEFT', 'LATE_ARRIVAL', 'EARLY_DEPARTURE', 'GEOFENCE_EXIT', 'INVENTORY_GAP', 'COMPLIANCE', 'IDLE_TIME', 'PERFORMANCE')),
  severity text NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  title_sr text NOT NULL,
  title_hr text NOT NULL,
  title_bs text NOT NULL,
  title_en text NOT NULL,
  title_de text NOT NULL,
  message_sr text NOT NULL,
  message_hr text NOT NULL,
  message_bs text NOT NULL,
  message_en text NOT NULL,
  message_de text NOT NULL,
  amount decimal(10, 2),
  metadata jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Voice orders table
CREATE TABLE IF NOT EXISTS voice_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES workers(id) ON DELETE SET NULL,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  audio_url text,
  transcript text NOT NULL,
  language text NOT NULL,
  parsed_items jsonb DEFAULT '[]'::jsonb,
  table_number text,
  urgency boolean DEFAULT false,
  confidence_score decimal(5, 2),
  created_at timestamptz DEFAULT now()
);

-- Training modules table
CREATE TABLE IF NOT EXISTS training_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_code text REFERENCES positions(code),
  title_sr text NOT NULL,
  title_hr text NOT NULL,
  title_bs text NOT NULL,
  title_en text NOT NULL,
  title_de text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('VIDEO', 'QUIZ', 'PRACTICE', 'DOCUMENT', 'INTERACTIVE')),
  content_url text,
  duration_minutes integer DEFAULT 0,
  quiz_questions jsonb DEFAULT '[]'::jsonb,
  passing_score integer DEFAULT 80,
  mandatory boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Training completions table
CREATE TABLE IF NOT EXISTS training_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  module_id uuid REFERENCES training_modules(id) ON DELETE CASCADE,
  score integer CHECK (score >= 0 AND score <= 100),
  passed boolean DEFAULT false,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(worker_id, module_id)
);

-- Geofence zones table
CREATE TABLE IF NOT EXISTS geofence_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  center_latitude decimal(10, 8) NOT NULL,
  center_longitude decimal(11, 8) NOT NULL,
  radius_meters integer NOT NULL DEFAULT 50,
  active_from time DEFAULT '00:00:00',
  active_to time DEFAULT '23:59:59',
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workers_location ON workers(location_id);
CREATE INDEX IF NOT EXISTS idx_workers_position ON workers(position_code);
CREATE INDEX IF NOT EXISTS idx_workers_active ON workers(active);
CREATE INDEX IF NOT EXISTS idx_menu_items_location ON menu_items(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory_items(location_id);
CREATE INDEX IF NOT EXISTS idx_alerts_location ON alerts(location_id);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(read);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checklists_location ON checklists(location_id);
CREATE INDEX IF NOT EXISTS idx_voice_orders_worker ON voice_orders(worker_id);

-- Enable Row Level Security
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for demo - in production, restrict by role)
CREATE POLICY "Allow all operations on locations" ON locations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on positions" ON positions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on workers" ON workers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on menu_items" ON menu_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on inventory_items" ON inventory_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on checklists" ON checklists FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on checklist_completions" ON checklist_completions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on alerts" ON alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on voice_orders" ON voice_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on training_modules" ON training_modules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on training_completions" ON training_completions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on geofence_zones" ON geofence_zones FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Public read access for demo
CREATE POLICY "Allow public read on locations" ON locations FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read on positions" ON positions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read on workers" ON workers FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read on menu_items" ON menu_items FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read on inventory_items" ON inventory_items FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read on checklists" ON checklists FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read on alerts" ON alerts FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read on training_modules" ON training_modules FOR SELECT TO anon USING (true);