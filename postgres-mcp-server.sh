#!/bin/bash
# Script để chạy MCP server cho PostgreSQL

# Chạy một phiên PostgreSQL tương tác trong Docker container
# Lệnh này sẽ duy trì kết nối mở
docker exec -it supabase-db psql -U postgres
