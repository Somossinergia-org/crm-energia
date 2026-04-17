#!/bin/bash

# Master Audit Script
# Ejecuta la auditoría completa del proyecto

set -e

echo "🔍 AUDITORÍA TÉCNICA COMPLETA - CRM ENERGÍA"
echo "============================================"
echo "Fecha: $(date)"
echo "Versión: v1.0.0"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d "backend" ] || [ ! -d "frontend" ] || [ ! -d "audit" ]; then
    echo "❌ Error: Ejecutar desde la raíz del proyecto CRM"
    exit 1
fi

echo "📋 Fase 1: Verificación de herramientas..."
echo "----------------------------------------"

# Verificar herramientas (simplificado para Windows)
echo "🔍 Verificando Node.js..."
node --version > /dev/null 2>&1 || { echo "❌ Node.js no encontrado"; exit 1; }
echo "✅ Node.js encontrado"

echo "🔍 Verificando npm..."
npm --version > /dev/null 2>&1 || { echo "❌ npm no encontrado"; exit 1; }
echo "✅ npm encontrado"

echo ""
echo "🔒 Fase 2: Auditoría de seguridad..."
echo "-----------------------------------"

# Backend audit
echo "📦 Auditando dependencias backend..."
cd backend
npm audit --audit-level=moderate > ../audit/evidence/npm-audit-backend.txt 2>&1 || true
cd ..

# Frontend audit
echo "🎨 Auditando dependencias frontend..."
cd frontend
npm audit --audit-level=moderate > ../audit/evidence/npm-audit-frontend.txt 2>&1 || true
cd ..

echo ""
echo "🧪 Fase 3: Verificación de calidad..."
echo "-----------------------------------"

# Verificar tests
TEST_COUNT=$(find . -name "*.test.*" -o -name "*.spec.*" | wc -l)
echo "📊 Archivos de test encontrados: $TEST_COUNT"

# Verificar TypeScript
echo "🔧 Verificando TypeScript backend..."
cd backend
npx tsc --noEmit > ../audit/evidence/typescript-check.txt 2>&1 || true
cd ..

echo "🔧 Verificando TypeScript frontend..."
cd frontend
npx tsc --noEmit > ../audit/evidence/typescript-frontend-check.txt 2>&1 || true
cd ..

echo ""
echo "🔍 Fase 4: Escaneo de seguridad..."
echo "--------------------------------"

# Ejecutar escaneo de secrets
chmod +x audit/scripts/scan-secrets.sh
./audit/scripts/scan-secrets.sh

echo ""
echo "📊 Fase 5: Generación de reportes..."
echo "----------------------------------"

# Contar vulnerabilidades
BACKEND_VULN=$(grep -c "Severity:" audit/evidence/npm-audit-backend.txt 2>/dev/null || echo "0")
FRONTEND_VULN=$(grep -c "Severity:" audit/evidence/npm-audit-frontend.txt 2>/dev/null || echo "0")
TOTAL_VULN=$((BACKEND_VULN + FRONTEND_VULN))

# Verificar errores TypeScript
TS_ERRORS_BACKEND=$(grep -c "error TS" audit/evidence/typescript-check.txt 2>/dev/null || echo "0")
TS_ERRORS_FRONTEND=$(grep -c "error TS" audit/evidence/typescript-frontend-check.txt 2>/dev/null || echo "0")

echo ""
echo "============================================"
echo "📊 RESULTADOS DE LA AUDITORÍA"
echo "============================================"
echo "🔒 Vulnerabilidades totales: $TOTAL_VULN"
echo "  - Backend: $BACKEND_VULN"
echo "  - Frontend: $FRONTEND_VULN"
echo ""
echo "🔧 Errores TypeScript:"
echo "  - Backend: $TS_ERRORS_BACKEND"
echo "  - Frontend: $TS_ERRORS_FRONTEND"
echo ""
echo "🧪 Tests automatizados: $TEST_COUNT archivos"
echo ""

# Evaluación final
if [ "$TOTAL_VULN" -gt 10 ]; then
    SECURITY_STATUS="🔴 CRÍTICO"
elif [ "$TOTAL_VULN" -gt 5 ]; then
    SECURITY_STATUS="🟠 ALTO"
elif [ "$TOTAL_VULN" -gt 0 ]; then
    SECURITY_STATUS="🟡 MEDIO"
else
    SECURITY_STATUS="✅ BAJO"
fi

if [ "$TEST_COUNT" -eq 0 ]; then
    TESTING_STATUS="🔴 CRÍTICO"
elif [ "$TEST_COUNT" -lt 5 ]; then
    TESTING_STATUS="🟠 ALTO"
else
    TESTING_STATUS="✅ ADECUADO"
fi

echo "🎯 EVALUACIÓN GENERAL:"
echo "  Seguridad: $SECURITY_STATUS"
echo "  Testing: $TESTING_STATUS"
echo ""

echo "📁 Evidencia guardada en: audit/evidence/"
echo "📋 Hallazgos detallados en: audit/findings/"
echo ""

if [ "$TOTAL_VULN" -gt 0 ] || [ "$TEST_COUNT" -eq 0 ]; then
    echo "⚠️  ACCIONES RECOMENDADAS:"
    [ "$TOTAL_VULN" -gt 0 ] && echo "  - Actualizar dependencias vulnerables"
    [ "$TEST_COUNT" -eq 0 ] && echo "  - Implementar tests automatizados"
    echo ""
fi

echo "✅ Auditoría completada exitosamente!"
echo "📅 Fecha: $(date)" >> audit/evidence/audit-history.log
echo "🔒 Vulnerabilidades: $TOTAL_VULN" >> audit/evidence/audit-history.log
echo "🧪 Tests: $TEST_COUNT" >> audit/evidence/audit-history.log
echo "---" >> audit/evidence/audit-history.log