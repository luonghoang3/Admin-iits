#!/bin/bash

echo "Restarting Docker containers..."

# Khởi động lại các container theo thứ tự phù hợp
echo "Restarting database..."
docker restart supabase-db
sleep 10

echo "Restarting API services..."
docker restart supabase-rest supabase-meta

echo "Restarting auth and storage..."
docker restart supabase-auth supabase-storage

echo "Restarting other services..."
docker restart supabase-analytics supabase-vector supabase-imgproxy

echo "Restarting realtime and edge functions..."
docker restart realtime-dev.supabase-realtime supabase-edge-functions

echo "Restarting pooler..."
docker restart supabase-pooler

echo "Restarting Kong API Gateway..."
docker restart supabase-kong

echo "Restarting Studio..."
docker restart supabase-studio

echo "Docker containers restarted successfully."

# Hiển thị trạng thái sau khi khởi động lại
echo "Current container status:"
docker ps -a
