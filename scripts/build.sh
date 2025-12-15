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

# Parse command line arguments
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
    export VITE_API_URL="https://api.bringweb3.io/v1/extension"
else
    # Custom environment build
    echo "Building for '$ENV_PARAM' environment..."
    export BUILD_ENV="$ENV_PARAM"
    export VITE_API_URL="https://api.bringweb3.io/$ENV_PARAM/v1/extension"
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

# Build SDK
echo "========================================"
echo "Building SDK..."
echo "========================================"
cd extension-files/bringweb3-sdk
yarn build
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

# Zip the built extension
cd ../..
node scripts/zip-extension.js "$ENV_PARAM"

echo "✓ Test extension build complete"
echo ""

# Build iframe-frontend
echo "========================================"
echo "Building iframe-frontend..."
echo "Environment: $ENV_PARAM"
echo "Api URL: $VITE_API_URL"
echo "=========================================="
cd iframe-frontend
export VITE_API_KEY
yarn build
cd ..
echo "✓ Iframe frontend build complete"
echo ""

echo "=========================================="
echo "✓ All builds completed successfully!"
echo "========================================"
