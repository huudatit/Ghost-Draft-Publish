#!/bin/sh
set -eu

DB_PATH="prisma/dev.db"

mkdir -p prisma

if [ ! -f "$DB_PATH" ]; then
  npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script | sqlite3 "$DB_PATH"
fi

USER_COUNT="$(sqlite3 "$DB_PATH" "SELECT count(*) FROM User;" 2>/dev/null || echo missing)"
if [ "$USER_COUNT" = "0" ] || [ "$USER_COUNT" = "missing" ]; then
  DATABASE_URL="file:./dev.db" npm run db:seed
fi
