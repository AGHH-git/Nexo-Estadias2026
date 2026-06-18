#!/bin/bash
# ============================================================
#  NEXUS ESTADÍAS 2026 — Script de Inicialización
#  Ejecutar UNA VEZ después de clonar el repositorio
# ============================================================

set -e  # Salir si algún comando falla

echo "🚀 Inicializando Nexus Estadías 2026..."

# ---------- BACKEND (NestJS) ----------
echo ""
echo "📦 Creando proyecto NestJS..."
cd backend
npm install -g @nestjs/cli 2>/dev/null || true
nest new . --package-manager npm --skip-git --language typescript

echo "📦 Instalando dependencias del backend..."
npm install \
  @nestjs/typeorm typeorm pg \
  @nestjs/jwt @nestjs/passport passport passport-jwt \
  @nestjs/config \
  bcrypt \
  class-validator class-transformer \
  pdf-lib \
  xlsx \
  multer uuid

npm install --save-dev \
  @types/bcrypt \
  @types/multer \
  @types/uuid \
  @types/passport-jwt

echo "✅ Backend listo."
cd ..

# ---------- FRONTEND (Angular) ----------
echo ""
echo "📦 Creando proyecto Angular 18..."
cd frontend
npm install -g @angular/cli 2>/dev/null || true
ng new . \
  --style=scss \
  --routing=true \
  --ssr=false \
  --skip-git \
  --standalone

echo "📦 Instalando dependencias del frontend..."
npm install \
  @angular/material \
  @angular/cdk \
  signature_pad \
  xlsx

echo "✅ Frontend listo."
cd ..

# ---------- ENVIRONMENT ----------
echo ""
echo "⚙️  Copiando variables de entorno..."
cp backend/.env.example backend/.env
echo "⚠️  Recuerda editar backend/.env con tus credenciales."

# ---------- DOCKER ----------
echo ""
echo "🐳 Levantando contenedores Docker..."
docker compose up -d --build

echo ""
echo "=============================================="
echo "✅ NEXUS ESTADÍAS 2026 inicializado."
echo ""
echo "   Frontend:  http://localhost:4200"
echo "   API:       http://localhost:3000"
echo "   Swagger:   http://localhost:3000/api/docs"
echo ""
echo "   Para Adminer (DB visual):"
echo "   docker compose --profile tools up -d"
echo "   → http://localhost:8080"
echo "=============================================="