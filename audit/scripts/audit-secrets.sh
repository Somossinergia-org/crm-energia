#!/bin/bash
# Script de auditoría de secretos

set -e

echo "🔐 Buscando secretos expuestos..."

# Instalar secretlint si no está disponible
if ! command -v secretlint &> /dev/null; then
    echo "Instalando secretlint..."
    npm install -g @secretlint/secretlint-rule-preset-recommend
fi

# Ejecutar en todo el proyecto
echo "🔍 Escaneando archivos..."
secretlint "**/*" --format unix | head -20

echo "✅ Auditoría de secretos completada"
