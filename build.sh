#!/bin/bash
set -e

echo "🔨 Building CRM Energía (Backend + Frontend)..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm ci --legacy-peer-deps

# Build backend TypeScript
echo "⚙️  Building backend..."
cd backend
npm ci --legacy-peer-deps
npm run build
cd ..

# Build frontend
echo "🎨 Building frontend..."
cd frontend
npm ci --legacy-peer-deps
npm run build
cd ..

echo "✅ Build complete!"
