#!/bin/bash

# Script to force cache refresh after file upload
# Usage: ./refresh-cache.sh

echo "🔄 Starting cache refresh process..."

# 1. Clear Nginx cache if exists
echo "📂 Clearing Nginx cache..."
if [ -d "/var/cache/nginx" ]; then
    sudo rm -rf /var/cache/nginx/*
    echo "✅ Nginx cache cleared"
else
    echo "ℹ️ Nginx cache directory not found"
fi

# 2. Reload Nginx configuration
echo "🔄 Reloading Nginx..."
sudo nginx -s reload
echo "✅ Nginx reloaded"

# 3. Send cache invalidation request to Next.js app
echo "🌐 Invalidating Next.js cache..."
curl -X POST http://localhost:3000/api/cache/invalidate \
  -H "Content-Type: application/json" \
  -d '{"paths":["/uploads","/"],"tags":["images","uploads"]}' \
  --silent --output /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Next.js cache invalidated"
else
    echo "❌ Failed to invalidate Next.js cache"
fi

# 4. Optional: Restart PM2 app (comment out if not needed)
# echo "🔄 Restarting PM2 app..."
# pm2 restart photobooth
# echo "✅ PM2 app restarted"

echo "🎉 Cache refresh completed!"
