#!/bin/bash

# Giới hạn tài nguyên cho các container chính
echo "Updating resource limits for containers..."

# Kong API Gateway
echo "Updating supabase-kong..."
docker update --cpus=0.5 supabase-kong

# Analytics
echo "Updating supabase-analytics..."
docker update --cpus=0.3 supabase-analytics

# Pooler
echo "Updating supabase-pooler..."
docker update --cpus=0.5 supabase-pooler

# Realtime
echo "Updating realtime-dev.supabase-realtime..."
docker update --cpus=0.3 realtime-dev.supabase-realtime

# Database
echo "Updating supabase-db..."
docker update --cpus=0.5 supabase-db

echo "Resource limits updated successfully."
