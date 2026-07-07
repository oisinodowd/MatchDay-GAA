-- =====================================================
-- MatchDay GAA - Initial Schema Migration (001)
-- All tables, indexes, RLS policies, helper functions
-- =====================================================

-- 1. COMPETITIONS TABLE
CREATE TABLE competitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sport 'gaelic-football' | 'hurling' DEFAULT 'gaelic-football',
  season_year INTEGER NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TEAMS TABLE
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  short_code CHAR(3),
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PLAYERS TABLE
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  number SMALLINT CHECK (number BETWEEN 1 AND 99),
  position VARCHAR(50), -- GK, DEF, MID, FWD
  shirt_color VARCHAR(7),
  is_captain BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MATCHES TABLE
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES competitions(id),
  team_home_id UUID REFERENCES teams(id),
  team_away_id UUID REFERENCES teams(id),
  venue VARCHAR(255),
  referee VARCHAR(255),
  
  -- Match State
  sport 'gaelic-football' | 'hurling' DEFAULT 'gaelic-football',
  status 'scheduled' | 'first-half' | 'halftime' | 'second-half' | 'completed' | 'postponed' | 'cancelled' DEFAULT 'scheduled',
  
  -- Score (stored as integers for easy calculation)
  home_score_goals SMALLINT DEFAULT 0,
  home_score_points SMALLINT DEFAULT 0,
  away_score_goals SMALLINT DEFAULT 0,
  away_score_points SMALLINT DEFAULT 0,
  
  -- Timing Configuration
  half_duration_minutes SMALLINT DEFAULT 30,
  extra_time_enabled BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper function: Calculate total points from goals and points
CREATE OR REPLACE FUNCTION calculate_total_points(goals SMALLINT, points SMALLINT)
RETURNS SMALLINT AS $$
BEGIN
  RETURN (goals * 3) + points;
END;
$$ LANGUAGE plpgsql;

-- Helper function: GAA score notation (Goals-Points format)
CREATE OR REPLACE FUNCTION gaa_score_notation(goals SMALLINT, points SMALLINT)
RETURNS TEXT AS $$
BEGIN
  RETURN goals || '-' || points;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Check if shot is from 40m zone (2025 rule change)
CREATE OR REPLACE FUNCTION is_two_point_shot(x_position FLOAT, field_width FLOAT)
RETURNS BOOLEAN AS $$
DECLARE
  D_HALF FLOAT := 45; -- 45 yards half-width of scoring zone
BEGIN
  -- If shot taken from outside the D (beyond 40m arc horizontally)
  RETURN ABS(x_position) > D_HALF OR x_position < -40 OR x_position > 40;
END;
$$ LANGUAGE plpgsql;

-- 5. MATCH_PLAYERS TABLE (Links players to specific matches)
CREATE TABLE match_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  team_side 'home' | 'away' NOT NULL,
  is_starter BOOLEAN DEFAULT FALSE,
  jersey_number SMALLINT,
  substituted_in BOOLEAN DEFAULT FALSE,
  substituted_out BOOLEAN DEFAULT FALSE,
  sub_player_id UUID REFERENCES match_players(id), -- Who replaced them
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EVENTS TABLE (All match events: scores, cards, subs, etc.)
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'score', 'yellow_card', 'red_card', 'black_card', 'substitution', 'free_taken', 'point_wide', 'goal_wide'
  
  -- Team/Player Reference
  team_side 'home' | 'away' NOT NULL,
  player_id UUID REFERENCES match_players(id),
  
  -- Timing
  minute SMALLINT NOT NULL,
  second SMALLINT DEFAULT 0,
  half VARCHAR(20) NOT NULL, -- 'first-half', 'second-half', 'extra-time-1', etc.
  
  -- Score Details (for scoring events)
  event_subtype VARCHAR(50), -- 'goal', 'point', 'free', '65-meter', '40m-point'
  x_position FLOAT, -- Shot coordinates for pitch mapping
  y_position FLOAT,
  is_two_point BOOLEAN DEFAULT FALSE, -- 2025 rule: shot from outside D
  
  -- Card Details
  card_type VARCHAR(20), -- 'yellow', 'black', 'red'
  
  -- Substitution Details
  player_out_id UUID REFERENCES match_players(id),
  
  -- Metadata for undo functionality
  previous_state JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SUBSTITUTIONS TABLE (Detailed sub tracking)
CREATE TABLE substitutions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_off_id UUID REFERENCES match_players(id),
  player_on_id UUID REFERENCES match_players(id),
  team_side 'home' | 'away' NOT NULL,
  minute SMALLINT,
  half VARCHAR(20),
  reason VARCHAR(50), -- 'tactical', 'injury', 'disciplinary'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CARDS TABLE (Detailed card tracking with sin-bin)
CREATE TABLE cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  match_player_id UUID REFERENCES match_players(id),
  team_side 'home' | 'away' NOT NULL,
  card_type VARCHAR(20) NOT NULL, -- 'yellow', 'black', 'red'
  minute SMALLINT,
  half VARCHAR(20),
  reason TEXT,
  
  -- Sin Bin tracking (black card)
  sin_bin_start_minute SMALLINT,
  sin_bin_end_minute SMALLINT,
  sin_bin_completed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MATCH_OFFICIALS TABLE
CREATE TABLE match_officials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'referee', 'umpire', 'timekeeper'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SEASON_STATS TABLE (Aggregated stats for analytics)
CREATE TABLE season_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES competitions(id),
  team_id UUID REFERENCES teams(id),
  player_id UUID REFERENCES players(id),
  
  -- Stats
  matches_played SMALLINT DEFAULT 0,
  total_goals SMALLINT DEFAULT 0,
  total_points SMALLINT DEFAULT 0,
  total_scores SMALLINT DEFAULT 0,
  cards_yellow SMALLINT DEFAULT 0,
  cards_black SMALLINT DEFAULT 0,
  cards_red SMALLINT DEFAULT 0,
  
  -- Calculated fields
  points_total SMALLINT DEFAULT 0, -- (goals * 3) + points
  
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- Matches indexes
CREATE INDEX idx_matches_competition ON matches(competition_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_scheduled_at ON matches(scheduled_at);
CREATE INDEX idx_matches_teams ON matches(team_home_id, team_away_id);

-- Events indexes (critical for timeline view)
CREATE INDEX idx_events_match ON events(match_id);
CREATE INDEX idx_events_match_minute ON events(match_id, half, minute, second);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_team_side ON events(match_id, team_side);

-- Players indexes
CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_match_players_match ON match_players(match_id);
CREATE INDEX idx_match_players_player ON match_players(player_id);

-- Cards indexes
CREATE INDEX idx_cards_match ON cards(match_id);
CREATE INDEX idx_cards_type ON cards(card_type);

-- Substitutions indexes
CREATE INDEX idx_subs_match ON substitutions(match_id);

-- Season stats indexes
CREATE INDEX idx_season_stats_competition ON season_stats(competition_id);
CREATE INDEX idx_season_stats_team ON season_stats(team_id);
CREATE INDEX idx_season_stats_player ON season_stats(player_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_stats ENABLE ROW LEVEL SECURITY;

-- Public read access (for viewing matches/reports without auth)
CREATE POLICY "Public can view competitions" ON competitions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage competitions" ON competitions FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage teams" ON teams FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view players" ON players FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage players" ON players FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage matches" ON matches FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view match_players" ON match_players FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage match_players" ON match_players FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view events" ON events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage events" ON events FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view substitutions" ON substitutions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage substitutions" ON substitutions FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view cards" ON cards FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage cards" ON cards FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view match_officials" ON match_officials FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage match_officials" ON match_officials FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view season_stats" ON season_stats FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage season_stats" ON season_stats FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- TRIGGERS for auto-updating updated_at timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON competitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
