/*
  # Smarter HoReCa AI Supreme v3.1 - Schema Upgrade

  ## Overview
  Nadogradnja sistema sa novim funkcionalnostima:
  - Rename inventory_items → artikli
  - Anonymous reports sa credibility assessment
  - Voice gap detection
  - Turnover predictions & collusion alerts
  - Test results sa PASSED/FAILED/CRITICAL
  - Check lista templates

  ## Changes

  ### 1. Rename inventory_items to artikli
  Preimenovanje tabele i ažuriranje svih referenci

  ### 2. anonymous_reports
  Sistem za anonimne prijave sa AI credibility scoring
  - reporter_hash (anoniman hash)
  - credibility_score (0-100)
  - report_type (theft, harassment, haccp_critical, collusion)
  - severity_ai (LOW, MEDIUM, HIGH, CRITICAL)
  - recommended_action

  ### 3. voice_gap_detection
  Detekcija razlika između voice orders i POS
  - voice_items (šta je AI čuo)
  - pos_items (šta je ukucano)
  - gap_items (šta nedostaje)
  - estimated_loss (€)
  - confidence_score

  ### 4. turnover_predictions
  AI predikcija grupnog odlaska radnika
  - workers_at_risk (array worker IDs)
  - sentiment_scores (array)
  - probability (%)
  - estimated_days
  - evidence (poruke, ponude)

  ### 5. collusion_alerts
  Detekcija dogovora između radnika
  - worker_1, worker_2
  - evidence_type (voice, video, pattern)
  - estimated_loss
  - confidence

  ### 6. test_results
  Rezultati obuka i testova
  - worker_id
  - test_name
  - score (0-100)
  - status (PASSED, FAILED, FAILED_CRITICAL)
  - certificate_id
  - action_required (SUSPEND_FROM_FOOD_HANDLING)
  - retest_date

  ### 7. checklist_templates
  Template-i za check liste po pozicijama
  - position_code
  - checklist_type
  - tasks (JSON array)
*/

-- 1. Rename inventory_items to artikli
ALTER TABLE IF EXISTS inventory_items RENAME TO artikli;

-- Update indexes
DROP INDEX IF EXISTS idx_inventory_location;
CREATE INDEX IF NOT EXISTS idx_artikli_location ON artikli(location_id);

-- 2. Anonymous Reports Table
CREATE TABLE IF NOT EXISTS anonymous_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  reporter_hash text NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('theft', 'harassment', 'haccp_critical', 'collusion', 'safety', 'fraud')),
  description text NOT NULL,
  evidence_data jsonb DEFAULT '{}'::jsonb,
  credibility_score integer CHECK (credibility_score >= 0 AND credibility_score <= 100),
  sender_profile text CHECK (sender_profile IN ('reliable', 'unreliable', 'average', 'new', 'unknown')),
  severity_ai text NOT NULL CHECK (severity_ai IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  recommended_action text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  assigned_to uuid REFERENCES workers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- 3. Voice Gap Detection Table
CREATE TABLE IF NOT EXISTS voice_gap_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES workers(id) ON DELETE SET NULL,
  detection_date date DEFAULT CURRENT_DATE,
  voice_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  pos_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  gap_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  estimated_loss decimal(10, 2) NOT NULL DEFAULT 0,
  confidence_score decimal(5, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  alert_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 4. Turnover Predictions Table
CREATE TABLE IF NOT EXISTS turnover_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  workers_at_risk jsonb NOT NULL DEFAULT '[]'::jsonb,
  sentiment_scores jsonb NOT NULL DEFAULT '[]'::jsonb,
  probability integer CHECK (probability >= 0 AND probability <= 100),
  estimated_days integer,
  evidence jsonb DEFAULT '[]'::jsonb,
  risk_level text CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'occurred', 'false_positive')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- 5. Collusion Alerts Table
CREATE TABLE IF NOT EXISTS collusion_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  worker_1_id uuid REFERENCES workers(id) ON DELETE SET NULL,
  worker_2_id uuid REFERENCES workers(id) ON DELETE SET NULL,
  collusion_type text NOT NULL CHECK (collusion_type IN ('theft', 'fraud', 'time_manipulation', 'inventory', 'cash')),
  evidence_type text NOT NULL CHECK (evidence_type IN ('voice', 'video', 'pattern', 'transaction', 'timing')),
  evidence_data jsonb DEFAULT '{}'::jsonb,
  estimated_loss decimal(10, 2),
  confidence_score decimal(5, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  status text DEFAULT 'investigating' CHECK (status IN ('investigating', 'confirmed', 'dismissed')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- 6. Test Results Table
CREATE TABLE IF NOT EXISTS test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  module_id uuid REFERENCES training_modules(id) ON DELETE CASCADE,
  test_name text NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  status text NOT NULL CHECK (status IN ('PASSED', 'FAILED', 'FAILED_CRITICAL')),
  certificate_id text,
  action_required text,
  report text,
  retest_date date,
  percentile integer,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(worker_id, module_id, completed_at)
);

-- 7. Checklist Templates Table
CREATE TABLE IF NOT EXISTS checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_code text REFERENCES positions(code),
  checklist_type text NOT NULL,
  name text NOT NULL,
  tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_anonymous_reports_location ON anonymous_reports(location_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_reports_status ON anonymous_reports(status);
CREATE INDEX IF NOT EXISTS idx_anonymous_reports_created ON anonymous_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_voice_gap_location ON voice_gap_detections(location_id);
CREATE INDEX IF NOT EXISTS idx_voice_gap_date ON voice_gap_detections(detection_date DESC);
CREATE INDEX IF NOT EXISTS idx_voice_gap_worker ON voice_gap_detections(worker_id);

CREATE INDEX IF NOT EXISTS idx_turnover_location ON turnover_predictions(location_id);
CREATE INDEX IF NOT EXISTS idx_turnover_status ON turnover_predictions(status);

CREATE INDEX IF NOT EXISTS idx_collusion_location ON collusion_alerts(location_id);
CREATE INDEX IF NOT EXISTS idx_collusion_status ON collusion_alerts(status);

CREATE INDEX IF NOT EXISTS idx_test_results_worker ON test_results(worker_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);

-- Enable RLS
ALTER TABLE anonymous_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_gap_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnover_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collusion_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all on anonymous_reports" ON anonymous_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read anonymous_reports" ON anonymous_reports FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all on voice_gap_detections" ON voice_gap_detections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read voice_gap" ON voice_gap_detections FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all on turnover_predictions" ON turnover_predictions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read turnover" ON turnover_predictions FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all on collusion_alerts" ON collusion_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read collusion" ON collusion_alerts FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all on test_results" ON test_results FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read test_results" ON test_results FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all on checklist_templates" ON checklist_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read templates" ON checklist_templates FOR SELECT TO anon USING (true);
