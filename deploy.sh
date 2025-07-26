#!/bin/bash

# Pre-deployment checks
echo "=== Pre-deployment Checks ==="

# Check if server is running
echo "Checking server status..."
curl -s http://localhost:8000/ > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Server is running on port 8000"
else
    echo "❌ Server is not responding on port 8000"
    exit 1
fi

# Check health endpoints
echo "Checking health endpoints..."
curl -s http://localhost:8000/health > /dev/null && echo "✅ /health endpoint working"
curl -s http://localhost:8000/ready > /dev/null && echo "✅ /ready endpoint working"
curl -s http://localhost:8000/healthz > /dev/null && echo "✅ /healthz endpoint working"

# Check database
echo "Checking database connection..."
if [ -n "$DATABASE_URL" ]; then
    echo "✅ DATABASE_URL is set"
else
    echo "❌ DATABASE_URL is not set"
fi

# Check bot token
if [ -n "$BOT_TOKEN" ]; then
    echo "✅ BOT_TOKEN is set"
else
    echo "⚠️ BOT_TOKEN is not set (using default)"
fi

echo "=== Deployment ready ==="
