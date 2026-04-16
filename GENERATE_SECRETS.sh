#!/bin/bash

# Generate secure random secrets for JWT
echo "🔐 Generating secure secrets for your .env file..."
echo ""

echo "JWT_SECRET:"
openssl rand -base64 32
echo ""

echo "JWT_REFRESH_SECRET:"
openssl rand -base64 32
echo ""

echo "Copy these values to your .env file in:"
echo "  - JWT_SECRET=<first_value>"
echo "  - JWT_REFRESH_SECRET=<second_value>"
echo ""

echo "Also update:"
echo "  - DB_HOST, DB_PASSWORD from Supabase"
echo "  - GEMINI_API_KEY from Google AI Studio"
echo "  - SMTP credentials if using email"
