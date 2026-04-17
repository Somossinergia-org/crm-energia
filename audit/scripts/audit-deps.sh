#!/bin/bash
# Script de auditoría de dependencias

set -e

echo "🔒 Auditando dependencias..."

# Backend
echo "📦 Backend audit..."
cd backend
npm audit --audit-level=moderate
cd ..

# Frontend
echo "🎨 Frontend audit..."
cd frontend
npm audit --audit-level=moderate
cd ..

echo "✅ Auditoría de dependencias completada"