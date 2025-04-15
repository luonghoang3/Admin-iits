#!/bin/bash
# Script để kết nối với PostgreSQL bằng psql

# Lấy truy vấn SQL từ đối số đầu tiên
SQL_QUERY="$1"

# Thực thi truy vấn bằng psql
PGPASSWORD=your-super-secret-and-long-postgres-password psql -h localhost -p 5432 -U postgres -d postgres -c "$SQL_QUERY"
