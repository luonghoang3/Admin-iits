#!/bin/bash
# Script để chạy MCP server PostgreSQL

# Chạy MCP server PostgreSQL với chuỗi kết nối đến PostgreSQL trong Docker
mcp-server-postgres "postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:5432/postgres"
