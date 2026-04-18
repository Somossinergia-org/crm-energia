#!/bin/bash
# Script de linting y formateo

set -e

echo "🔍 Ejecutando linting..."

# Backend
echo "📦 Backend lint..."
cd backend
npm run lint
cd ..

# Frontend
echo "🎨 Frontend lint..."
cd frontend
npm run lint
cd ..

echo "✅ Linting completado"
