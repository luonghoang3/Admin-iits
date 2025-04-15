#!/bin/bash
# Script để chạy MCP server PostgreSQL trong Docker

# Chạy MCP server PostgreSQL với chuỗi kết nối đến PostgreSQL trong Docker
docker run -i --rm --network=supabase_default -e DATABASE_URI="postgresql://postgres:your-super-secret-and-long-postgres-password@supabase-db:5432/postgres" crystaldba/postgres-mcp --access-mode=unrestricted
