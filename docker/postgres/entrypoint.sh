#!/bin/sh
# Validate before upstream initdb or any SQL can see credentials. Never enable shell tracing.
set +x
set -eu

invalid() {
  printf '%s\n' "DB_CONFIG_INVALID: $1 See docs/local-development.md; no volumes were reset." >&2
  exit 2
}

valid_admin_password() {
  [ "${#1}" -eq 64 ] || return 1
  case "$1" in
    *[!0123456789abcdefABCDEF]*) return 1 ;;
  esac
}

valid_admin_password "${POSTGRES_PASSWORD:-}" ||
  invalid 'Each administrator password must contain exactly 64 hexadecimal characters.'
valid_admin_password "${BOOTSTRAP_PEER_ADMIN_PASSWORD:-}" ||
  invalid 'Each administrator password must contain exactly 64 hexadecimal characters.'
[ "$POSTGRES_PASSWORD" != "$BOOTSTRAP_PEER_ADMIN_PASSWORD" ] ||
  invalid 'Development and test administrator passwords must differ.'
[ -n "${APP_DB_PASSWORD:-}" ] && [ -n "${BOOTSTRAP_PEER_DB_PASSWORD:-}" ] ||
  invalid 'Set both nonempty application passwords.'
[ "$APP_DB_PASSWORD" != "$BOOTSTRAP_PEER_DB_PASSWORD" ] ||
  invalid 'Development and test application passwords must differ.'
[ "${POSTGRES_DB:-}" = postgres ] && [ "${PGDATABASE:-}" = postgres ] ||
  invalid 'Keep the upstream bootstrap database set to postgres.'
[ -f /etc/postgresql.schema.sql ] && [ -r /etc/postgresql.schema.sql ] ||
  invalid 'The project bootstrap SQL mount must be a readable file.'

# Upstream interpolates the validated administrator password in SQL. Protect all of its
# psql sessions too, including errors and duration/audit logging, before the project hook.
export PGOPTIONS='-c log_statement=none -c log_min_error_statement=panic -c log_min_duration_statement=-1 -c log_min_duration_sample=-1 -c log_transaction_sample_rate=0 -c pgaudit.log=none'
unset BOOTSTRAP_PEER_ADMIN_PASSWORD BOOTSTRAP_PEER_DB_PASSWORD

printf '%s\n' 'DB_BOOTSTRAP: fresh storage initializes once; existing storage keeps its passwords. For failed initialization or health checks, see docs/local-development.md.'
exec /usr/local/bin/docker-entrypoint.sh "$@"
