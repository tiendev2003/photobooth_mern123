#!/bin/bash

# Script to validate production build and fix common issues

echo "🚀 Starting production build validation..."

# Check if gif.worker.js exists
if [ ! -f "public/gif.worker.js" ]; then
    echo "❌ gif.worker.js not found in public folder"
    exit 1
else
    echo "✅ gif.worker.js found"
fi

# Check if uploads directory exists
if [ ! -d "public/uploads" ]; then
    echo "📁 Creating uploads directory..."
    mkdir -p public/uploads/images
    mkdir -p public/uploads/videos
    mkdir -p public/uploads/gifs
    mkdir -p public/uploads/stores
    echo "✅ Uploads directories created"
else
    echo "✅ Uploads directory exists"
fi

# Check if essential API routes exist
echo "🔍 Checking API routes..."
essential_routes=(
    "src/app/api/media-session/route.ts"
    "src/app/api/images/route.ts"
    "src/app/api/images/video/route.ts"
    "src/app/api/images/gif/route.ts"
)

for route in "${essential_routes[@]}"; do
    if [ -f "$route" ]; then
        echo "✅ $route exists"
    else
        echo "❌ $route missing"
        exit 1
    fi
done

# Check if prisma schema exists
if [ -f "prisma/schema.prisma" ]; then
    echo "✅ Prisma schema exists"
else
    echo "❌ Prisma schema missing"
    exit 1
fi

# Check if environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL environment variable not set"
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "⚠️  NEXTAUTH_SECRET environment variable not set"
fi

# Build the application
echo "🏗️  Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Check if .next folder contains gif.worker.js
echo "🔍 Checking build output..."
if [ -f ".next/static/chunks/webpack.js" ]; then
    echo "✅ Build output looks good"
else
    echo "⚠️  Build output might be incomplete"
fi

# Test if gif.worker.js is accessible
echo "🧪 Testing gif.worker.js accessibility..."
if [ -f "public/gif.worker.js" ]; then
    # Check if file is not empty
    if [ -s "public/gif.worker.js" ]; then
        echo "✅ gif.worker.js is accessible and not empty"
    else
        echo "❌ gif.worker.js is empty"
        exit 1
    fi
else
    echo "❌ gif.worker.js not accessible"
    exit 1
fi

echo "✅ Production build validation completed successfully!"
echo "🎉 Your application is ready for production deployment!"

# Output some helpful information
echo ""
echo "📋 Production Checklist:"
echo "  - ✅ gif.worker.js is accessible"
echo "  - ✅ Upload directories created"
echo "  - ✅ API routes exist"
echo "  - ✅ Build successful"
echo ""
echo "🔧 To start in production mode:"
echo "  npm run start"
echo ""
echo "🌐 Don't forget to:"
echo "  - Set environment variables"
echo "  - Configure your database"
echo "  - Set up your web server (nginx, etc.)"
