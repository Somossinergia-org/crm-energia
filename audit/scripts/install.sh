#!/bin/bash
# Script de instalación reproducible

set -e

echo "🔧 Instalando dependencias..."

# Backend
echo "📦 Backend..."
cd backend
npm ci
cd ..

# Frontend
echo "🎨 Frontend..."
cd frontend
npm ci
cd ..

echo "✅ Instalación completada"
