#!/usr/bin/env bash
# Render build script for the FastAPI backend
set -o errexit

echo "==> Installing Python dependencies..."
pip install --upgrade pip
pip install --no-cache-dir -r requirements.txt

echo "==> Build complete!"
