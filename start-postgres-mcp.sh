#!/bin/bash
# Script để khởi động MCP Server PostgreSQL

# Lấy thông tin kết nối từ Docker
DB_PASSWORD=$(docker exec supabase-db printenv POSTGRES_PASSWORD)

# Khởi động MCP Server PostgreSQL
npx @modelcontextprotocol/server-postgres "postgresql://postgres:${DB_PASSWORD}@localhost:5432/postgres"
