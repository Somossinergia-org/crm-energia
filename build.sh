#!/bin/bash
set -e

echo "🔨 Building CRM Energía (Backend + Frontend)..."

# Build backend TypeScript
echo "⚙️  Building backend..."
cd backend
npm ci --legacy-peer-deps
npm run build

# Copy compiled backend to api/ for Vercel deployment
echo "📦 Packaging backend into serverless..."
cd ..
mkdir -p api/backend
cp -r backend/dist api/backend/
cp -r backend/node_modules api/backend/

# Build frontend
echo "🎨 Building frontend..."
cd frontend
npm ci --legacy-peer-deps
npm run build
cd ..

echo "✅ Build complete!"
