INSERT INTO roles (name, is_system)
VALUES
  ('admin', TRUE),
  ('organiser', FALSE),
  ('developer', FALSE),
  ('designer', FALSE),
  ('mappooler', FALSE),
  ('mapper', FALSE),
  ('playtester', FALSE),
  ('mapper', FALSE),
  ('streamer', FALSE),
  ('commentator', FALSE),
  ('referee', FALSE),
  ('player', TRUE),
  ('captain', TRUE)
ON CONFLICT (name) DO NOTHING;
