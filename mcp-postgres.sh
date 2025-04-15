#!/bin/bash
# Script để chạy MCP server PostgreSQL

# Chạy MCP server PostgreSQL với chuỗi kết nối đến PostgreSQL trong Docker
/home/dmin/.npm-global/bin/mcp-server-postgres postgresql://postgres:your-super-secret-and-long-postgres-password@172.18.0.14:5432/postgres
