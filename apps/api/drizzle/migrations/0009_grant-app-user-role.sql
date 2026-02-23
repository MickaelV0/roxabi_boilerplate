-- Grant app_user role to the current connection user.
-- This allows SET LOCAL ROLE app_user to work on any platform (including Neon)
-- where the connection user is not a superuser.
GRANT app_user TO current_user;
