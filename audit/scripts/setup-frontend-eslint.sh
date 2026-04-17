#!/bin/bash

# Frontend ESLint Setup Script
# Configura ESLint para el proyecto frontend

set -e

echo "🎨 Configurando ESLint para Frontend..."
echo "======================================="

cd frontend

# Verificar si ya está instalado
if [ -f ".eslintrc.json" ]; then
    echo "⚠️  ESLint ya está configurado. ¿Deseas sobrescribir? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Operación cancelada."
        exit 0
    fi
fi

echo "📦 Instalando dependencias de ESLint..."

# Instalar dependencias
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y eslint-plugin-import eslint-config-prettier eslint-plugin-prettier

echo "📝 Creando configuración de ESLint..."

# Crear .eslintrc.json
cat > .eslintrc.json << 'EOF'
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "plugins": [
    "react",
    "react-hooks",
    "@typescript-eslint",
    "jsx-a11y",
    "import",
    "prettier"
  ],
  "rules": {
    "prettier/prettier": "error",
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "import/order": [
      "error",
      {
        "groups": [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        "newlines-between": "always"
      }
    ],
    "jsx-a11y/anchor-is-valid": [
      "error",
      {
        "components": ["Link"],
        "specialLink": ["hrefLeft", "hrefRight"],
        "aspects": ["invalidHref", "preferButton"]
      }
    ]
  },
  "settings": {
    "react": {
      "version": "detect"
    },
    "import/resolver": {
      "typescript": {
        "alwaysTryTypes": true
      }
    }
  },
  "ignorePatterns": [
    "dist/",
    "build/",
    "node_modules/",
    "*.config.js",
    "*.config.ts"
  ]
}
EOF

# Crear .eslintignore si no existe
if [ ! -f ".eslintignore" ]; then
    cat > .eslintignore << 'EOF'
dist/
build/
node_modules/
*.config.js
*.config.ts
coverage/
.vite/
EOF
fi

echo "🔍 Ejecutando ESLint por primera vez..."

# Ejecutar ESLint
if npx eslint src --ext .ts,.tsx --max-warnings 0 > ../../audit/evidence/eslint-frontend-first-run.txt 2>&1; then
    echo "✅ ESLint ejecutado correctamente - sin errores"
else
    echo "⚠️  ESLint encontró problemas (ver audit/evidence/eslint-frontend-first-run.txt)"
fi

echo "📋 Añadiendo scripts a package.json..."

# Añadir scripts si no existen
if ! grep -q '"lint"' package.json; then
    # Usar sed para añadir scripts antes del cierre de "scripts"
    sed -i 's/"scripts": {/"scripts": {\n    "lint": "eslint src --ext .ts,.tsx",\n    "lint:fix": "eslint src --ext .ts,.tsx --fix",/g' package.json
fi

cd ..

echo ""
echo "✅ ESLint configurado exitosamente!"
echo ""
echo "📝 Comandos disponibles:"
echo "  npm run lint        - Ejecutar ESLint"
echo "  npm run lint:fix    - Ejecutar ESLint y corregir automáticamente"
echo ""
echo "📁 Configuración guardada en: frontend/.eslintrc.json"
echo "📋 Evidencia en: audit/evidence/eslint-frontend-first-run.txt"