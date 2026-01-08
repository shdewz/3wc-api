-- user and role data

CREATE TABLE IF NOT EXISTS users (
  user_id BIGINT PRIMARY KEY,
  username TEXT NOT NULL,
  country_code TEXT NOT NULL,
  avatar_url TEXT,
  discord_id TEXT,
  discord_username TEXT,
  discord_avatar_url TEXT,
  global_rank INT,
  country_rank INT,
  registered BOOLEAN DEFAULT FALSE,
  wants_captain BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- format: 'area:action'
  description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- tournament data

CREATE TABLE IF NOT EXISTS tournaments (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  tournament_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournament_registration (
  tournament_id SERIAL NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  registration_start_utc TIMESTAMPTZ NOT NULL,
  registration_end_utc TIMESTAMPTZ NOT NULL,
  override_active BOOLEAN,
  override_reason TEXT,
  PRIMARY KEY (tournament_id)
);

CREATE TABLE IF NOT EXISTS tournament_bracket_config (
  tournament_id SERIAL NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  bracket_start_utc TIMESTAMPTZ NOT NULL,
  rounds JSONB NOT NULL,
  override_active BOOLEAN,
  override_current_round TEXT,
  PRIMARY KEY (tournament_id)
);

-- auth data

CREATE TABLE IF NOT EXISTS tokens (
  user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id)
);

CREATE TABLE IF NOT EXISTS discord_tokens (
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id)
);

-- indeces

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users (user_id);
CREATE INDEX IF NOT EXISTS idx_users_country ON users (country_code);
CREATE INDEX IF NOT EXISTS idx_tournaments_slug ON tournaments (slug);
