#!/bin/bash
set -e

echo "🔄 Starting deployment..."

# Ensure uploads directory is safe
UPLOAD_DIR="$(pwd)/uploads"
echo "📁 Ensuring uploads folder exists..."
mkdir -p "$UPLOAD_DIR"
echo "✅ Uploads directory safe at: $UPLOAD_DIR"

# (Optional) Backup uploads pre-deploy
cp -r "$UPLOAD_DIR" "uploads_backup_$(date +%Y%m%d%H%M)"

# Build client
echo "🎨 Building React client..."
cd client
npm run build
if [ ! -d "dist" ]; then
  echo "❌ Client build failed."
  exit 1
fi
echo "✅ Client build complete."

# Build server
echo "🛠️ Building server..."
cd ../
npx esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outfile=dist/server/index.js \
  --target=node18
if [ ! -f "dist/server/index.js" ]; then
  echo "❌ Server build failed."
  exit 1
fi
echo "✅ Server build complete."

# Restart PM2
echo "🚀 Restarting PM2..."
pm2 restart ecosystem.config.cjs --only your-app-name
echo "✅ PM2 restarted."

echo "🎉 Deployment successful."
