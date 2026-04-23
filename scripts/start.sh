#!/bin/sh
set -eu

./scripts/init-db.sh
exec node server.js
