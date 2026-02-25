-- Seed system settings (12 settings across 5 categories)
-- Idempotent: ON CONFLICT (key) DO NOTHING
INSERT INTO "system_settings" ("id", "key", "value", "type", "name", "description", "category", "metadata", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'app.name', '"Roxabi"', 'string', 'Application Name', 'The name of the application displayed in the UI', 'General', NULL, now(), now()),
  (gen_random_uuid(), 'app.supportEmail', '""', 'string', 'Support Email', 'Contact email for user support inquiries', 'General', NULL, now(), now()),
  (gen_random_uuid(), 'app.maintenanceMode', 'false', 'boolean', 'Maintenance Mode', 'When enabled, shows a maintenance page to all users', 'General', NULL, now(), now()),
  (gen_random_uuid(), 'auth.signupEnabled', 'true', 'boolean', 'Signup Enabled', 'Allow new users to sign up', 'Authentication', NULL, now(), now()),
  (gen_random_uuid(), 'auth.sessionTtlHours', '168', 'number', 'Session TTL (hours)', 'How long user sessions remain valid', 'Authentication', NULL, now(), now()),
  (gen_random_uuid(), 'auth.maxLoginAttempts', '5', 'number', 'Max Login Attempts', 'Maximum failed login attempts before lockout', 'Authentication', NULL, now(), now()),
  (gen_random_uuid(), 'org.maxMembers', '100', 'number', 'Max Members per Org', 'Maximum number of members allowed per organization', 'Organizations', NULL, now(), now()),
  (gen_random_uuid(), 'org.allowSelfRegistration', 'false', 'boolean', 'Allow Org Self-Registration', 'Allow users to create their own organizations', 'Organizations', NULL, now(), now()),
  (gen_random_uuid(), 'email.fromName', '"Roxabi"', 'string', 'Email From Name', 'Sender name for outgoing emails', 'Email', NULL, now(), now()),
  (gen_random_uuid(), 'email.fromAddress', '""', 'string', 'Email From Address', 'Sender email address for outgoing emails', 'Email', NULL, now(), now()),
  (gen_random_uuid(), 'email.footerText', '""', 'string', 'Email Footer Text', 'Text displayed in the footer of all outgoing emails', 'Email', NULL, now(), now()),
  (gen_random_uuid(), 'security.passwordMinLength', '8', 'number', 'Min Password Length', 'Minimum number of characters required for passwords', 'Security', NULL, now(), now())
ON CONFLICT ("key") DO NOTHING;
