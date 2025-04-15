#!/bin/bash
# Script để kết nối với PostgreSQL trong Docker container

# Lấy truy vấn SQL từ đối số đầu tiên
SQL_QUERY="$1"

# Thực thi truy vấn trong container PostgreSQL
docker exec supabase-db psql -U postgres -t -c "$SQL_QUERY"
