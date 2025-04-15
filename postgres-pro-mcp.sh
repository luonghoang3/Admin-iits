#!/bin/bash
# Script để chạy Postgres Pro MCP server với Docker

# Chạy Postgres Pro MCP server với chế độ không hạn chế (cho phát triển)
docker run -i --rm \
  -e DATABASE_URI="postgresql://postgres:your-super-secret-and-long-postgres-password@supabase-db:5432/postgres" \
  --network=supabase_default \
  crystaldba/postgres-mcp \
  --access-mode=unrestricted
