#!/bin/sh
set -e

pnpm run migrate:dev
exec pnpm exec tsx watch src/app.ts
