#!/bin/bash

echo "🔄 Ejecutando migraciones de base de datos..."
echo ""

# Variables
DB_URL=$DATABASE_URL

if [ -z "$DB_URL" ]; then
  echo "❌ ERROR: DATABASE_URL no está configurada"
  echo "   Asegúrate de que .env tiene la URL de Supabase"
  exit 1
fi

echo "📍 Conectando a: $DB_URL"
echo ""

# Ejecutar migraciones en orden
echo "1️⃣ Creando tabla 'users'..."
psql "$DB_URL" < backend/migrations/001_users.sql

echo "✅ Tabla 'users' creada"
echo ""

echo "2️⃣ Creando tabla 'prospects'..."
psql "$DB_URL" < backend/migrations/002_prospects.sql

echo "✅ Tabla 'prospects' creada"
echo ""

echo "3️⃣ Creando tabla 'contact_history'..."
psql "$DB_URL" < backend/migrations/003_contact_history.sql

echo "✅ Tabla 'contact_history' creada"
echo ""

echo "4️⃣ Creando otras tablas..."
psql "$DB_URL" < backend/migrations/004_emails_enviados.sql
psql "$DB_URL" < backend/migrations/005_sessions.sql

echo "✅ Todas las tablas creadas"
echo ""

echo "5️⃣ Insertando datos de prueba (seeds)..."
psql "$DB_URL" < backend/seeds/001_users.sql
psql "$DB_URL" < backend/seeds/002_prospects.sql

echo "✅ Datos de prueba insertados"
echo ""

echo "🎉 ¡Base de datos configurada correctamente!"
echo ""
echo "Próximo paso: Desplegar backend en Render"
