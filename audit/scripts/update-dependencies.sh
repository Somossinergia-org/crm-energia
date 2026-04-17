#!/bin/bash

# Dependency Update Script
# Actualiza dependencias y verifica compatibilidad

set -e

echo "📦 Actualizando dependencias del proyecto..."
echo "==========================================="

# Función para backup
create_backup() {
    local dir=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="../../audit/evidence/backup_$timestamp"

    echo "📦 Creando backup de $dir en $backup_dir..."
    mkdir -p "$backup_dir"
    cp -r "$dir/package.json" "$backup_dir/"
    cp -r "$dir/package-lock.json" "$backup_dir/" 2>/dev/null || true
}

# Función para verificar cambios
check_changes() {
    local dir=$1
    echo "🔍 Verificando cambios en $dir..."

    # Ejecutar tests si existen
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        echo "🧪 Ejecutando tests..."
        if npm test; then
            echo "✅ Tests pasaron"
        else
            echo "❌ Tests fallaron"
            return 1
        fi
    fi

    # Verificar compilación TypeScript
    if [ -f "tsconfig.json" ]; then
        echo "🔧 Verificando TypeScript..."
        if npx tsc --noEmit; then
            echo "✅ TypeScript compila correctamente"
        else
            echo "❌ Errores de TypeScript"
            return 1
        fi
    fi
}

echo "🔧 Actualizando Backend..."

cd backend
create_backup "backend"

echo "📦 Actualizando dependencias..."
npm update

echo "🔍 Verificando compatibilidad..."
if check_changes "backend"; then
    echo "✅ Backend actualizado correctamente"
else
    echo "⚠️  Problemas detectados en backend"
fi

cd ..

echo ""
echo "🎨 Actualizando Frontend..."

cd frontend
create_backup "frontend"

echo "📦 Actualizando dependencias..."
npm update

echo "🔍 Verificando compatibilidad..."
if check_changes "frontend"; then
    echo "✅ Frontend actualizado correctamente"
else
    echo "⚠️  Problemas detectados en frontend"
fi

cd ..

echo ""
echo "🔒 Verificando seguridad después de actualización..."

# Backend audit
cd backend
echo "🔍 Audit backend..."
npm audit --audit-level=moderate > ../audit/evidence/npm-audit-backend-post-update.txt 2>&1 || true

cd ..

# Frontend audit
cd frontend
echo "🔍 Audit frontend..."
npm audit --audit-level=moderate > ../audit/evidence/npm-audit-frontend-post-update.txt 2>&1 || true

cd ..

echo ""
echo "📊 Generando reporte de actualización..."

# Comparar vulnerabilidades
BEFORE_BACKEND=$(grep -c "Severity:" audit/evidence/npm-audit-backend.txt 2>/dev/null || echo "0")
AFTER_BACKEND=$(grep -c "Severity:" audit/evidence/npm-audit-backend-post-update.txt 2>/dev/null || echo "0")

BEFORE_FRONTEND=$(grep -c "Severity:" audit/evidence/npm-audit-frontend.txt 2>/dev/null || echo "0")
AFTER_FRONTEND=$(grep -c "Severity:" audit/evidence/npm-audit-frontend-post-update.txt 2>/dev/null || echo "0")

echo "======================================="
echo "📊 REPORTE DE ACTUALIZACIÓN"
echo "======================================="
echo "Backend vulnerabilidades: $BEFORE_BACKEND → $AFTER_BACKEND"
echo "Frontend vulnerabilidades: $BEFORE_FRONTEND → $AFTER_FRONTEND"

if [ "$AFTER_BACKEND" -lt "$BEFORE_BACKEND" ] || [ "$AFTER_FRONTEND" -lt "$BEFORE_FRONTEND" ]; then
    echo "✅ Vulnerabilidades reducidas!"
elif [ "$AFTER_BACKEND" -gt "$BEFORE_BACKEND" ] || [ "$AFTER_FRONTEND" -gt "$BEFORE_FRONTEND" ]; then
    echo "⚠️  Nuevas vulnerabilidades detectadas"
else
    echo "ℹ️  Sin cambios en vulnerabilidades"
fi

echo ""
echo "📁 Evidencia guardada en: audit/evidence/"
echo "📋 Backups creados con timestamp"

echo ""
echo "✅ Actualización completada!"