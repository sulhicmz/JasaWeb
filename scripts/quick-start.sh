#!/bin/bash

# JasaWeb Quick Start Script
# Fast setup for experienced developers

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 JasaWeb Quick Start${NC}"
echo "========================="

# Quick checks
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "📦 Enabling pnpm..."
    corepack enable
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Setup environment files
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file"
fi

# Start database
echo "🗄️ Starting database..."
docker-compose up -d

# Wait a moment
sleep 5

# Run migrations
echo "🔄 Running migrations..."
pnpm db:migrate

# Start development
echo "🎯 Starting development servers..."
echo ""
echo "🌐 Web: http://localhost:4321"
echo "🔧 API: http://localhost:3000"
echo "📚 API Docs: http://localhost:3000/api/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

pnpm dev