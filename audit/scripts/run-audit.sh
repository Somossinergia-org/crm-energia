#!/bin/bash

# Audit Automation Script
# Ejecuta verificaciones automatizadas del proyecto

set -e

echo "🔍 Iniciando auditoría automatizada..."
echo "========================================"

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Función para ejecutar comando con timeout
run_with_timeout() {
    local timeout=$1
    shift
    (
        "$@" &
        child_pid=$!
        (
            sleep "$timeout"
            kill "$child_pid" 2>/dev/null
        ) &
        wait "$child_pid"
    )
}

echo "📋 Verificando herramientas instaladas..."

# Verificar Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js no encontrado"
    exit 1
fi

# Verificar npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm no encontrado"
    exit 1
fi

# Verificar Docker
if command_exists docker; then
    DOCKER_VERSION=$(docker --version)
    echo "✅ Docker: $DOCKER_VERSION"
else
    echo "⚠️  Docker no encontrado (opcional para desarrollo local)"
fi

echo ""
echo "🔒 Verificando seguridad..."

# Backend audit
echo "📦 Backend - Verificando dependencias..."
cd backend

# Verificar si existe package-lock.json
if [ ! -f "package-lock.json" ]; then
    echo "⚠️  No se encontró package-lock.json en backend"
else
    echo "✅ package-lock.json encontrado"
fi

# Ejecutar npm audit
echo "🔍 Ejecutando npm audit..."
if npm audit --audit-level=moderate > ../audit/evidence/npm-audit-backend.txt 2>&1; then
    echo "✅ npm audit completado"
else
    echo "⚠️  Vulnerabilidades encontradas (ver audit/evidence/npm-audit-backend.txt)"
fi

# Verificar archivos de configuración de seguridad
if [ -f ".env" ]; then
    echo "✅ Archivo .env encontrado"
else
    echo "❌ Archivo .env no encontrado"
fi

# Verificar si hay secrets en el código
echo "🔍 Buscando posibles secrets..."
grep -r "password\|secret\|key\|token" src/ --include="*.ts" --include="*.js" | grep -v "process.env" | grep -v "import" | grep -v "require" > ../audit/evidence/potential-secrets-backend.txt || true

if [ -s ../audit/evidence/potential-secrets-backend.txt ]; then
    echo "⚠️  Posibles secrets encontrados (ver audit/evidence/potential-secrets-backend.txt)"
else
    echo "✅ No se encontraron secrets obvios"
fi

cd ..

# Frontend audit
echo ""
echo "🎨 Frontend - Verificando dependencias..."
cd frontend

# Verificar si existe package-lock.json
if [ ! -f "package-lock.json" ]; then
    echo "⚠️  No se encontró package-lock.json en frontend"
else
    echo "✅ package-lock.json encontrado"
fi

# Ejecutar npm audit
echo "🔍 Ejecutando npm audit..."
if npm audit --audit-level=moderate > ../audit/evidence/npm-audit-frontend.txt 2>&1; then
    echo "✅ npm audit completado"
else
    echo "⚠️  Vulnerabilidades encontradas (ver audit/evidence/npm-audit-frontend.txt)"
fi

cd ..

echo ""
echo "🧪 Verificando testing..."

# Verificar si hay archivos de test
TEST_FILES=$(find . -name "*.test.*" -o -name "*.spec.*" -o -name "__tests__" | wc -l)
if [ "$TEST_FILES" -gt 0 ]; then
    echo "✅ Encontrados $TEST_FILES archivos de test"
else
    echo "❌ No se encontraron archivos de test"
fi

echo ""
echo "📊 Verificando configuración..."

# Verificar archivos de configuración
CONFIG_FILES=(".eslintrc.json" "tsconfig.json" ".prettierrc" ".editorconfig")
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file encontrado"
    else
        echo "❌ $file no encontrado"
    fi
done

echo ""
echo "🔍 Verificando estructura del proyecto..."

# Verificar estructura básica
REQUIRED_DIRS=("backend/src" "backend/migrations" "frontend/src" "audit/findings")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ Directorio $dir existe"
    else
        echo "❌ Directorio $dir no encontrado"
    fi
done

echo ""
echo "🚀 Verificando funcionalidad básica..."

# Verificar si el backend puede iniciar
echo "🔧 Probando compilación TypeScript backend..."
cd backend
if npx tsc --noEmit > ../audit/evidence/typescript-check.txt 2>&1; then
    echo "✅ TypeScript backend compila correctamente"
else
    echo "❌ Errores de TypeScript en backend (ver audit/evidence/typescript-check.txt)"
fi
cd ..

# Verificar si el frontend puede iniciar
echo "🔧 Probando compilación TypeScript frontend..."
cd frontend
if npx tsc --noEmit > ../audit/evidence/typescript-frontend-check.txt 2>&1; then
    echo "✅ TypeScript frontend compila correctamente"
else
    echo "❌ Errores de TypeScript en frontend (ver audit/evidence/typescript-frontend-check.txt)"
fi
cd ..

echo ""
echo "📈 Generando reporte de resumen..."

# Contar vulnerabilidades
BACKEND_VULN=$(grep -c "Severity:" audit/evidence/npm-audit-backend.txt 2>/dev/null || echo "0")
FRONTEND_VULN=$(grep -c "Severity:" audit/evidence/npm-audit-frontend.txt 2>/dev/null || echo "0")
TOTAL_VULN=$((BACKEND_VULN + FRONTEND_VULN))

# Contar errores de TypeScript
TS_ERRORS_BACKEND=$(grep -c "error TS" audit/evidence/typescript-check.txt 2>/dev/null || echo "0")
TS_ERRORS_FRONTEND=$(grep -c "error TS" audit/evidence/typescript-frontend-check.txt 2>/dev/null || echo "0")

echo "========================================"
echo "📊 RESUMEN DE AUDITORÍA"
echo "========================================"
echo "🔒 Vulnerabilidades encontradas: $TOTAL_VULN"
echo "🧪 Archivos de test: $TEST_FILES"
echo "🔧 Errores TypeScript Backend: $TS_ERRORS_BACKEND"
echo "🔧 Errores TypeScript Frontend: $TS_ERRORS_FRONTEND"
echo ""
echo "📁 Evidencia guardada en: audit/evidence/"
echo "📋 Hallazgos detallados en: audit/findings/"
echo ""
echo "✅ Auditoría completada!"

# Crear timestamp del reporte
echo "$(date): Audit completed - $TOTAL_VULN vulnerabilities, $TEST_FILES test files" >> audit/evidence/audit-history.log
