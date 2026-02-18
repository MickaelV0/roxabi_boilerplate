ALTER TABLE "users" ADD COLUMN "avatar_options" jsonb DEFAULT '{}'::jsonb;

-- Backfill: Case 1 — avatar_style set, image null → compute CDN URL
UPDATE users SET image = concat('https://api.dicebear.com/9.x/', avatar_style, '/svg?seed=', COALESCE(avatar_seed, id::text))
WHERE avatar_style IS NOT NULL AND image IS NULL;

-- Backfill: Case 2 — both null → set defaults + CDN URL
UPDATE users SET avatar_style = 'lorelei', avatar_seed = id::text, avatar_options = '{}',
  image = concat('https://api.dicebear.com/9.x/lorelei/svg?seed=', id::text)
WHERE avatar_style IS NULL AND image IS NULL;

-- Backfill: Case 3 — image already set (OAuth) → only set defaults if missing
UPDATE users SET avatar_style = COALESCE(avatar_style, 'lorelei'), avatar_seed = COALESCE(avatar_seed, id::text),
  avatar_options = COALESCE(avatar_options, '{}')
WHERE avatar_style IS NULL AND image IS NOT NULL;