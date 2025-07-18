#!/bin/bash

# MongoDB Memory Bank MCP Server - Local Setup Script

set -e

echo "🚀 Setting up MongoDB Memory Bank MCP Server locally..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is required but not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is required but not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your settings."
fi

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose up -d --build

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Configure your MCP client (Claude Desktop, Cursor, etc.)"
    echo "2. Add this server to your MCP configuration:"
    echo "   Command: node"
    echo "   Args: [\"$(pwd)/dist/main/index.js\"]"
    echo "   Env: STORAGE_MODE=mongodb, MONGODB_URI=mongodb://admin:password@localhost:27017/memory_bank?authSource=admin"
    echo ""
    echo "🔧 Useful commands:"
    echo "  - View logs: docker-compose logs -f"
    echo "  - Stop services: docker-compose down"
    echo "  - Restart: docker-compose restart"
else
    echo "❌ Some services failed to start. Check logs with: docker-compose logs"
    exit 1
fi
