#!/bin/bash
# Script để kết nối với PostgreSQL trong Docker container cho MCP

# Khởi động một phiên PostgreSQL tương tác trong Docker container
# Lệnh này sẽ duy trì kết nối mở
docker exec -it supabase-db psql -U postgres
