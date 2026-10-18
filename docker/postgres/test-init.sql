\set ON_ERROR_STOP on
\set ECHO none
\set VERBOSITY sqlstate
\set SHOW_CONTEXT never

SET log_statement = 'none';
SET log_min_error_statement = 'panic';
SET log_min_duration_statement = -1;
SET log_min_duration_sample = -1;
SET log_transaction_sample_rate = 0;
SET pgaudit.log = 'none';
\getenv app_password APP_DB_PASSWORD
CREATE ROLE trading_test LOGIN PASSWORD :'app_password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
\unset app_password

CREATE DATABASE trading_test OWNER supabase_admin;
REVOKE ALL ON DATABASE trading_test FROM PUBLIC;
REVOKE ALL ON DATABASE trading_test FROM trading_test;
GRANT CONNECT, TEMPORARY ON DATABASE trading_test TO trading_test;
REVOKE CONNECT ON DATABASE postgres, template1 FROM PUBLIC;

\connect trading_test supabase_admin
REVOKE ALL ON SCHEMA public FROM PUBLIC, trading_test;

\echo 'DB_BOOTSTRAP_OK: trading_test is ready with CONNECT and TEMP privileges only.'
