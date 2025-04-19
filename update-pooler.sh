#!/bin/bash

# Tạo file cấu hình tạm thời
cat > pooler-env.txt << EOF
API_JWT_SECRET=e8951851bf4f59787dee301af1b37a0f12ecd2dc8c9815d1d447ea4355705266278272ab2286ff77
VAULT_ENC_KEY=your-encryption-key-32-chars-min
DATABASE_URL=ecto://supabase_admin:your-super-secret-and-long-postgres-password@db:5432/_supabase
ERL_AFLAGS=-proto_dist inet_tcp
SECRET_KEY_BASE=UpNVntn3cDxHJpq99YMc1T1AQgQpc8kfYTuRgBiYa15BLrx8etQoXz3gZv1/u2oq
POOLER_POOL_MODE=transaction
POSTGRES_DB=postgres
PORT=4000
POOLER_MAX_CLIENT_CONN=50
POOLER_TENANT_ID=your-tenant-id
EOF

# Dừng container
docker stop supabase-pooler

# Khởi động lại với biến môi trường mới
docker run --detach --restart=always \
  --name supabase-pooler-new \
  --network=supabase_network \
  --env-file=pooler-env.txt \
  --cpus=0.5 \
  supabase/supavisor:2.4.12

# Xóa container cũ
docker rm supabase-pooler

# Đổi tên container mới
docker rename supabase-pooler-new supabase-pooler
