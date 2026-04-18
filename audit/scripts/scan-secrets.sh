#!/bin/bash

# Secrets Scanning Script
# Busca posibles secrets en el código

set -e

echo "🔍 Escaneando secrets en el proyecto..."
echo "======================================="

OUTPUT_FILE="audit/evidence/secrets-scan-$(date +%Y%m%d_%H%M%S).txt"

echo "📋 Reporte de escaneo de secrets" > "$OUTPUT_FILE"
echo "Generado: $(date)" >> "$OUTPUT_FILE"
echo "=================================" >> "$OUTPUT_FILE"

# Función para escanear directorio
scan_directory() {
    local dir=$1
    local label=$2

    echo "" >> "$OUTPUT_FILE"
    echo "🔍 Escaneando $label..." >> "$OUTPUT_FILE"
    echo "Directorio: $dir" >> "$OUTPUT_FILE"
    echo "----------------------------------------" >> "$OUTPUT_FILE"

    if [ ! -d "$dir" ]; then
        echo "⚠️  Directorio $dir no encontrado" >> "$OUTPUT_FILE"
        return
    fi

    # Patrones de secrets comunes
    PATTERNS=(
        "password.*="
        "secret.*="
        "key.*="
        "token.*="
        "api_key.*="
        "apikey.*="
        "access_token.*="
        "refresh_token.*="
        "private_key.*="
        "database_url.*="
        "db_password.*="
        "JWT_SECRET.*="
        "STRIPE_SECRET.*="
        "AWS_ACCESS_KEY.*="
        "GOOGLE_API_KEY.*="
    )

    FOUND_SECRETS=false

    for pattern in "${PATTERNS[@]}"; do
        # Buscar en archivos de código, excluyendo node_modules y archivos de configuración conocidos
        RESULTS=$(grep -r -i "$pattern" "$dir" \
            --include="*.ts" \
            --include="*.js" \
            --include="*.tsx" \
            --include="*.jsx" \
            --include="*.json" \
            --include="*.env*" \
            --exclude-dir="node_modules" \
            --exclude-dir=".git" \
            --exclude-dir="dist" \
            --exclude-dir="build" \
            --exclude-dir="coverage" \
            2>/dev/null || true)

        if [ -n "$RESULTS" ]; then
            echo "🚨 Posibles secrets encontrados para patrón: $pattern" >> "$OUTPUT_FILE"
            echo "$RESULTS" >> "$OUTPUT_FILE"
            echo "" >> "$OUTPUT_FILE"
            FOUND_SECRETS=true
        fi
    done

    if [ "$FOUND_SECRETS" = false ]; then
        echo "✅ No se encontraron secrets obvios" >> "$OUTPUT_FILE"
    fi
}

# Escanear backend
scan_directory "backend/src" "Backend Source"
scan_directory "backend" "Backend Root (config files)"

# Escanear frontend
scan_directory "frontend/src" "Frontend Source"
scan_directory "frontend" "Frontend Root (config files)"

# Escanear root del proyecto
scan_directory "." "Project Root"

# Verificar archivos .env
echo "" >> "$OUTPUT_FILE"
echo "🔐 Verificación de archivos .env" >> "$OUTPUT_FILE"
echo "----------------------------------------" >> "$OUTPUT_FILE"

ENV_FILES=$(find . -name ".env*" -type f 2>/dev/null | grep -v node_modules || true)

if [ -n "$ENV_FILES" ]; then
    echo "Archivos .env encontrados:" >> "$OUTPUT_FILE"
    echo "$ENV_FILES" >> "$OUTPUT_FILE"

    for env_file in $ENV_FILES; do
        echo "" >> "$OUTPUT_FILE"
        echo "Contenido de $env_file:" >> "$OUTPUT_FILE"
        if [ -f "$env_file" ]; then
            # Mostrar solo líneas que contienen = (variables), ocultando valores
            grep "=" "$env_file" | sed 's/=.*$/=<HIDDEN>/' >> "$OUTPUT_FILE" || true
        fi
    done
else
    echo "❌ No se encontraron archivos .env" >> "$OUTPUT_FILE"
fi

# Verificar .gitignore
echo "" >> "$OUTPUT_FILE"
echo "📋 Verificación de .gitignore" >> "$OUTPUT_FILE"
echo "----------------------------------------" >> "$OUTPUT_FILE"

if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore; then
        echo "✅ .env está en .gitignore" >> "$OUTPUT_FILE"
    else
        echo "⚠️  .env NO está en .gitignore" >> "$OUTPUT_FILE"
    fi
else
    echo "❌ No se encontró .gitignore" >> "$OUTPUT_FILE"
fi

# Resumen
echo "" >> "$OUTPUT_FILE"
echo "=================================" >> "$OUTPUT_FILE"
echo "📊 RESUMEN DEL ESCANEO" >> "$OUTPUT_FILE"
echo "=================================" >> "$OUTPUT_FILE"

SECRETS_FOUND=$(grep -c "🚨 Posibles secrets encontrados" "$OUTPUT_FILE" || echo "0")
echo "Secrets potenciales encontrados: $SECRETS_FOUND" >> "$OUTPUT_FILE"

if [ "$SECRETS_FOUND" -gt 0 ]; then
    echo "⚠️  REVISAR MANUALMENTE - Posibles secrets detectados" >> "$OUTPUT_FILE"
else
    echo "✅ Sin secrets obvios detectados" >> "$OUTPUT_FILE"
fi

echo ""
echo "✅ Escaneo completado!"
echo "📁 Reporte guardado en: $OUTPUT_FILE"

# Mostrar resumen en consola
echo ""
echo "📊 Resumen:"
echo "- Secrets potenciales: $SECRETS_FOUND"
if [ "$SECRETS_FOUND" -gt 0 ]; then
    echo "⚠️  Revisar el reporte completo para detalles"
else
    echo "✅ Sin problemas detectados"
fi
