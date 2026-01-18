#!/bin/bash

# Build script for BringWeb3 Chrome Extension
# Usage: ./scripts/build.sh [environment] [options]
# Examples:
#   ./scripts/build.sh          # Build for production (no env parameter)
#   ./scripts/build.sh danielk  # Build for danielk environment
#   ./scripts/build.sh sandbox --identifier my-id --wallet addr1qy... --iframe-api-key my-key
#   ./scripts/build.sh --identifier prod-id --iframe-api-key prod-key
#
# Arguments:
#   environment              - Optional environment name (sandbox, danielk, etc.)
#   --identifier VALUE       - Extension identifier key (PLATFORM_IDENTIFIER)
#   --wallet VALUE           - Wallet address for testing (WALLET_ADDRESS)
#   --iframe-api-key VALUE   - API key for iframe-frontend (VITE_API_KEY)
#   --version VALUE          - SDK version (optional)

set -e  # Exit on error

# Help function
show_help() {
    cat << EOF
Build script for BringWeb3 Chrome Extension

USAGE:
    ./scripts/build.sh [environment] [options]

ARGUMENTS:
    environment              Optional environment name (sandbox, danielk, etc.)
                            If omitted, builds for production

OPTIONS:
    --identifier VALUE       Extension identifier key (required)
    --wallet VALUE          Wallet address for testing (required)
    --iframe-api-key VALUE  API key for iframe-frontend (required or use .env.local)
    --version VALUE         SDK version (optional)
    -h, --help             Show this help message

EXAMPLES:
    # Production build
    ./scripts/build.sh --identifier prod-id --wallet addr1qy... --iframe-api-key prod-key

    # Sandbox environment build
    ./scripts/build.sh sandbox --identifier sandbox-id --wallet addr1qy... --iframe-api-key sandbox-key

    # Using .env.local for iframe API key
    ./scripts/build.sh --identifier my-id --wallet addr1qy...

    # Custom environment
    ./scripts/build.sh danielk --identifier dev-id --wallet addr1qy... --iframe-api-key dev-key

NOTES:
    - VITE_API_KEY can be loaded from iframe-frontend/.env.local if not provided
    - PLATFORM_IDENTIFIER and WALLET_ADDRESS must be provided via command line or environment
    - Production build uses https://api.bringweb3.io/v1/extension
    - Other environments use https://api.bringweb3.io/[env]/v1/extension

EOF
    exit 0
}

# Function to validate version format
validate_version() {
    local version=$1
    # Validate version format (X.Y.Z where X, Y, Z are numbers)
    if [[ ! $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "❌ ERROR: Invalid version format: $version"
        echo "Version must be in format X.Y.Z (e.g., 1.0.0, 2.1.3)"
        exit 1
    fi
}

# Parse command line arguments
HOST=api.bring.network
ENV_PARAM=""
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            ;;
        --identifier)
            PLATFORM_IDENTIFIER="$2"
            shift 2
            ;;
        --wallet)
            WALLET_ADDRESS="$2"
            shift 2
            ;;
        --iframe-api-key)
            VITE_API_KEY="$2"
            shift 2
            ;;
        --version)
            SDK_VERSION="$2"
            validate_version "$SDK_VERSION"
            shift 2
            ;;
        --*)
            echo "Unknown option: $1"
            exit 1
            ;;
        *)
            # First non-option argument is the environment
            if [ -z "$ENV_PARAM" ]; then
                ENV_PARAM="$1"
            fi
            shift
            ;;
    esac
done

# Set environment variables based on input
if [ -z "$ENV_PARAM" ]; then
    # Production build (no environment parameter)
    echo "Building for PRODUCTION environment..."
    export BUILD_ENV=""
    export VITE_API_URL="https://$HOST/v1/extension"
else
    # Custom environment build
    echo "Building for '$ENV_PARAM' environment..."
    export BUILD_ENV="$ENV_PARAM"
    export VITE_API_URL="https://$HOST/$ENV_PARAM/v1/extension"
fi

echo "API URL: $VITE_API_URL"
echo ""

# Load iframe-frontend .env.local file if it exists (only for unset VITE_API_KEY)
if [ -f "iframe-frontend/.env.local" ] && [ -z "$VITE_API_KEY" ]; then
    echo "Loading iframe-frontend environment variables from .env.local..."
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z $key ]] && continue
        # Only set VITE_API_KEY if not already defined
        if [ "$key" = "VITE_API_KEY" ] && [ -z "${!key}" ]; then
            export "$key=$value"
        fi
    done < iframe-frontend/.env.local
fi

# Validate required environment variables
echo ""
echo "========================================"
echo "Configuration Check"
echo "========================================"
echo "PLATFORM_IDENTIFIER: ${PLATFORM_IDENTIFIER:-(not set)}"
echo "WALLET_ADDRESS: ${WALLET_ADDRESS:-(not set)}"
echo "VITE_API_KEY: ${VITE_API_KEY:-(not set)}"
echo "SDK_VERSION: ${SDK_VERSION:-(default)}"
echo "BUILD_ENV: ${BUILD_ENV:-(production)}"
echo ""

# Check that all required variables are set
MISSING_VARS=()
if [ -z "$PLATFORM_IDENTIFIER" ]; then
    MISSING_VARS+=("PLATFORM_IDENTIFIER")
fi
if [ -z "$WALLET_ADDRESS" ]; then
    MISSING_VARS+=("WALLET_ADDRESS")
fi
if [ -z "$VITE_API_KEY" ]; then
    MISSING_VARS+=("VITE_API_KEY")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ ERROR: Required variables are not set:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Please provide them via:"
    echo "  1. Command line: ./scripts/build.sh --identifier ID --wallet ADDR --iframe-api-key KEY"
    echo "  2. Environment: export PLATFORM_IDENTIFIER=ID WALLET_ADDRESS=ADDR VITE_API_KEY=KEY"
    echo "  3. .env.local file (iframe only): Create iframe-frontend/.env.local with VITE_API_KEY"
    echo ""
    exit 1
fi
# Start build timer
BUILD_START_TIME=$(date +%s)
# Run setup script to ensure project is properly configured
echo "========================================"
echo "Running setup script..."
echo "========================================"
bash scripts/setup.sh
echo "✓ Setup complete"
echo ""

# Build SDK
echo "========================================"
echo "Building SDK..."
echo "========================================"
cd extension-files/bringweb3-sdk
if [ -n "$SDK_VERSION" ]; then
    echo "Using SDK version: $SDK_VERSION"
    yarn build --env.VERSION="$SDK_VERSION"
else
    yarn build
fi
cd ../..
echo "✓ SDK build complete"
echo ""

# Build test-extension
echo "========================================"
echo "Building test-extension..."
echo "========================================"
cd extension-files/test-extension
export PLATFORM_IDENTIFIER
export WALLET_ADDRESS
yarn build
cd ../..
echo "✓ Test extension build complete"
echo ""

# Get version before zipping
if [ -n "$SDK_VERSION" ]; then
    ZIP_VERSION="$SDK_VERSION"
else
    ZIP_VERSION=$(node -p "require('./extension-files/bringweb3-sdk/package.json').version")
    validate_version "$ZIP_VERSION"
fi

# Zip the built extension
if [ -n "$ENV_PARAM" ]; then
    node scripts/zip-extension.js "$ENV_PARAM" "$ZIP_VERSION"
else
    node scripts/zip-extension.js "prod" "$ZIP_VERSION"
fi

# Build iframe-frontend
echo "========================================"
echo "Building iframe-frontend..."
echo "Environment: ${ENV_PARAM:-prod}"
echo "Api URL: $VITE_API_URL"
echo "=========================================="
cd iframe-frontend
export VITE_API_KEY

# Get version from SDK package.json or use provided SDK_VERSION
if [ -n "$SDK_VERSION" ]; then
    VERSION="$SDK_VERSION"
else
    VERSION=$(node -p "require('../extension-files/bringweb3-sdk/package.json').version")
    validate_version "$VERSION"
fi
echo "Version: $VERSION"

# Set base path based on environment
if [ -n "$ENV_PARAM" ]; then
    BASE_PATH="/v$VERSION/$ENV_PARAM/"
else
    BASE_PATH="/v$VERSION/"
fi
echo "Base Path: $BASE_PATH"
export VITE_BASE_PATH="$BASE_PATH"

# Prevent Git Bash path conversion on Windows
MSYS_NO_PATHCONV=1 yarn build --base="$BASE_PATH"

cd ..
echo "✓ Iframe frontend build complete"
echo ""

# Copy iframe-frontend build to builds directory
echo "Copying iframe-frontend build to builds directory..."
if [ -n "$ENV_PARAM" ]; then
    BUILD_OUTPUT_DIR="builds/$ENV_PARAM/v$VERSION"
else
    BUILD_OUTPUT_DIR="builds/prod/v$VERSION"
fi
mkdir -p "$BUILD_OUTPUT_DIR"
cp -r iframe-frontend/dist "$BUILD_OUTPUT_DIR/iframe-frontend"
echo "✓ Iframe frontend copied to: $BUILD_OUTPUT_DIR/iframe-frontend"
echo ""

# Calculate and display build time
BUILD_END_TIME=$(date +%s)
BUILD_DURATION=$((BUILD_END_TIME - BUILD_START_TIME))
BUILD_MINUTES=$((BUILD_DURATION / 60))
BUILD_SECONDS=$((BUILD_DURATION % 60))

echo "=========================================="
echo "✓ All builds completed successfully!"
if [ $BUILD_MINUTES -gt 0 ]; then
    echo "⏱️  Total build time: ${BUILD_MINUTES}m ${BUILD_SECONDS}s"
else
    echo "⏱️  Total build time: ${BUILD_SECONDS}s"
fi
echo "========================================"
