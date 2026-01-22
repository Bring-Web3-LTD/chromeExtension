#!/bin/bash

# Setup script for BringWeb3 Chrome Extension
# This script automates the initial project setup

set -e  # Exit on error

echo "==========================================="
echo "BringWeb3 Chrome Extension - Setup"
echo "==========================================="
echo ""

# Step 1: Install dependencies for all sub-repos
echo "Step 1/4: Installing dependencies..."
echo "-------------------------------------------"

echo "Installing iframe-frontend dependencies..."
yarn install --cwd iframe-frontend

echo "Installing bringweb3-sdk dependencies..."
yarn install --cwd extension-files/bringweb3-sdk

echo "Installing test-extension dependencies..."
yarn install --cwd extension-files/test-extension

echo "✓ All dependencies installed"
echo ""

# Step 2: Create yarn links
echo "Step 2/4: Creating yarn links..."
echo "-------------------------------------------"

echo "Creating link for bringweb3-sdk..."
yarn link --cwd extension-files/bringweb3-sdk

echo "Linking bringweb3-sdk to test-extension..."
yarn link @bringweb3/chrome-extension-kit --cwd extension-files/test-extension

echo "✓ Yarn links created"
echo ""

# Step 3: Create .env files if they don't exist
echo "Step 3/4: Setting up environment files..."
echo "-------------------------------------------"

# Create .env for test-extension
if [ ! -f "extension-files/test-extension/.env" ]; then
    cat > extension-files/test-extension/.env << 'EOF'
# Test Extension Environment Variables
# Replace these placeholder values with your actual credentials

PLATFORM_IDENTIFIER=your-platform-identifier-here
WALLET_ADDRESS=addr1qydfh2z0m4j2297rzwsu7dfu4ld3a6nhgytrn2wzxgvdlwd6y4l5psyq79gflnhwlttgw8gk7aj5j6lj95vg7my67vpsdcvu4l
BUILD_ENV=
EOF
    echo "✓ Created extension-files/test-extension/.env"
    echo "  ⚠️  Please edit this file and add your PLATFORM_IDENTIFIER"
else
    echo "✓ extension-files/test-extension/.env already exists"
fi

# Create .env.local for iframe-frontend
if [ ! -f "iframe-frontend/.env.local" ]; then
    cat > iframe-frontend/.env.local << 'EOF'
# Iframe Frontend Environment Variables
# Replace this placeholder value with your actual API key

VITE_API_KEY=your-api-key-here
EOF
    echo "✓ Created iframe-frontend/.env.local"
    echo "  ⚠️  Please edit this file and add your VITE_API_KEY"
else
    echo "✓ iframe-frontend/.env.local already exists"
fi

echo ""

# Step 4: Copy popup.html to build directory
echo "Step 4/4: Setting up build directory..."
echo "-------------------------------------------"

if [ -f "extension-files/test-extension/src/popup.html" ]; then
    mkdir -p extension-files/test-extension/build
    cp extension-files/test-extension/src/popup.html extension-files/test-extension/build/
    echo "✓ Copied popup.html to build directory"
else
    echo "⚠️  popup.html not found in src directory"
fi

echo ""
echo "==========================================="
echo "✓ Setup Complete!"
echo "==========================================="
echo ""
echo "Next steps:"
echo "1. Edit extension-files/test-extension/.env"
echo "   - Add your PLATFORM_IDENTIFIER"
echo "   - Optionally update WALLET_ADDRESS"
echo ""
echo "2. Edit iframe-frontend/.env.local"
echo "   - Add your VITE_API_KEY"
echo ""
echo "3. Build the project:"
echo "   ./scripts/build.sh --identifier YOUR_ID --wallet YOUR_WALLET --iframe-api-key YOUR_KEY"
echo ""
echo "4. Or start development mode:"
echo "   cd extension-files/test-extension && yarn watch"
echo "   cd iframe-frontend && yarn dev"
echo ""
