#!/bin/bash

# MongoDB Memory Bank MCP Server - Atlas Setup Script

set -e

echo "🚀 Setting up MongoDB Memory Bank MCP Server with Atlas..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created."
fi

# Prompt for Atlas connection string
read -p "Enter your MongoDB Atlas connection string: " ATLAS_URI
read -p "Enter your database name (default: memory_bank): " DB_NAME
DB_NAME=${DB_NAME:-memory_bank}
read -p "Do you have a Voyage AI API key for vector search? (y/n): " HAS_VOYAGE_KEY

if [[ $HAS_VOYAGE_KEY == "y" ]]; then
    read -p "Enter your Voyage AI API key: " VOYAGE_KEY
    ENABLE_VECTOR="true"
else
    VOYAGE_KEY=""
    ENABLE_VECTOR="false"
fi

# Update .env file
echo "📝 Updating .env file with Atlas configuration..."
cat > .env << EOF
# MongoDB Memory Bank MCP Server Configuration

# Storage mode (always use 'mongodb' for this version)
STORAGE_MODE=mongodb

# MongoDB Atlas configuration
MONGODB_URI=${ATLAS_URI}
MONGODB_DATABASE=${DB_NAME}
MONGODB_ATLAS=true
ENABLE_VECTOR_SEARCH=${ENABLE_VECTOR}
VOYAGE_API_KEY=${VOYAGE_KEY}
EOF

echo "✅ .env file updated with Atlas configuration."

# Build the application
echo "🏗️  Building the application..."
npm run build

echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your MCP client (Claude Desktop, Cursor, etc.)"
echo "2. Add this server to your MCP configuration:"
echo "   Command: node"
echo "   Args: [\"$(pwd)/dist/main/index.js\"]"
echo "   Env: STORAGE_MODE=mongodb, MONGODB_URI=${ATLAS_URI}, MONGODB_ATLAS=true"
echo ""
echo "🚀 Start the server with: npm start"
