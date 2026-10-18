\set ON_ERROR_STOP on
\set ECHO none
\set VERBOSITY sqlstate
\set SHOW_CONTEXT never

-- Passwords come from the environment, never shell-built SQL or psql command arguments.
SET log_statement = 'none';
SET log_min_error_statement = 'panic';
SET log_min_duration_statement = -1;
SET log_min_duration_sample = -1;
SET log_transaction_sample_rate = 0;
SET pgaudit.log = 'none';
\getenv app_password APP_DB_PASSWORD
CREATE ROLE trading_dev LOGIN PASSWORD :'app_password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
\unset app_password

CREATE DATABASE trading_dev OWNER trading_dev;
CREATE DATABASE trading_shadow OWNER trading_dev;
REVOKE ALL ON DATABASE trading_dev, trading_shadow FROM PUBLIC;
REVOKE CONNECT ON DATABASE postgres, template1 FROM PUBLIC;

\connect trading_dev supabase_admin
REVOKE ALL ON SCHEMA public FROM PUBLIC;
ALTER SCHEMA public OWNER TO trading_dev;

\connect trading_shadow supabase_admin
REVOKE ALL ON SCHEMA public FROM PUBLIC;
ALTER SCHEMA public OWNER TO trading_dev;

\echo 'DB_BOOTSTRAP_OK: trading_dev and migration-only trading_shadow are ready.'
