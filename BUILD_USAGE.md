# Build Script Usage Guide

The `build.sh` script supports configurable environment variables via command-line arguments or .env files.

## Required Variables

All three variables are **mandatory** for the build to succeed:

### Test Extension
- **PLATFORM_IDENTIFIER** - Your extension identifier key (required)
- **WALLET_ADDRESS** - Wallet address for testing (required)

### Iframe Frontend
- **VITE_API_KEY** - API key for iframe (required)

### Optional
- **BUILD_ENV** - Environment name for API routing (optional)

## Usage Methods

### Method 1: Command-Line Arguments (Recommended)

Pass variables directly in the build command:

```bash
# Production build with all options
./scripts/build.sh --identifier my-id --wallet addr1qy... --iframe-api-key my-key

# Sandbox build with options
./scripts/build.sh sandbox --identifier my-id --iframe-api-key my-key

# Production with just required values
./scripts/build.sh --identifier my-id --iframe-api-key my-key

# Custom environment with custom wallet
./scripts/build.sh danielk --identifier my-id --wallet custom-addr --iframe-api-key my-key
```

**Available Flags:**
- `--identifier VALUE` - Sets PLATFORM_IDENTIFIER
- `--wallet VALUE` - Sets WALLET_ADDRESS
- `--iframe-api-key VALUE` - Sets VITE_API_KEY
### Method 3: Hybrid Approach

Command-line arguments take precedence over .env files:

```bash
# Use .env file values but override wallet address
./scripts/build.sh sandbox --wallet different-address

# Use .env files but override API key
./scripts/build.sh --iframe-api-key different-key
```

### Method 4: Environment Variables
### Method 2: Using .env Files

Create `.env` files with your configuration:

1. **Test Extension** - Create `extension-files/test-extension/.env`:
   ```bash
   PLATFORM_IDENTIFIER=your-identifier-here
   WALLET_ADDRESS=your-wallet-address  # optional
   ```

2. **Iframe Frontend** - Create `iframe-frontend/.env.local`:
   ```bash
   VITE_API_KEY=your-api-key-here
   ```

Then run the build script:
```bash
./scripts/build.sh          # Production build
./scripts/build.sh sandbox  # Sandbox environment
./scripts/build.sh danielk  # Custom environment
```

### Method 2: Environment Variables on Command Line

Set variables before running the script:

```bash
# One-time build with specific values
PLATFORM_IDENTIFIER=my-id WALLET_ADDRESS=addr1qy... VITE_API_KEY=my-key ./scripts/build.sh

# Or export for multiple builds
export PLATFORM_IDENTIFIER=my-id
export WALLET_ADDRESS=addr1qy...
export VITE_API_KEY=my-key
./scripts/build.sh sandbox
```

**Priority Order** (highest to lowest):
1. Command-line arguments (`--iframe-api-key value`)
2. Environment variables (`export VITE_API_KEY=value`)
3. .env files

### Method 5: Mix and Match

Combine any of the above methods:

```bash
# Override WALLET_ADDRESS from .env file
WALLET_ADDRESS=different-address ./scripts/build.sh
```

## Examples

### Basic Production Build
```bash
# Using command-line arguments
./scripts/build.sh --identifier prod-id --iframe-api-key prod-key
```

### Sandbox Build with All Options
```bash
./scripts/build.sh sandbox --identifier sandbox-id --wallet addr1qytest... --iframe-api-key sandbox-key
```

### Using .env Files
```bash
# Just run build - reads from .env files
./scripts/build.sh
./scripts/build.sh sandbox
```

### Override One Value from .env
```bash
# Use .env for most values, override API key
./scripts/build.sh --iframe-api-key different-key
```

### Environment-Specific Builds
```bash
# Development
./scripts/build.sh danielk --identifier dev-id --iframe-api-key dev-key

# Staging
./scripts/build.sh sandbox --identifier staging-id --iframe-api-key staging-key

# Production
./scripts/build.sh --identifier prod-id --iframe-api-key prod-key
```

## Configuration Check

The script shows a configuration summary before building:

```
==========================================
Configuration Check
==========================================
PLATFORM_IDENTIFIER: your-id-here
WALLET_ADDRESS: addr1qy...
VITE_API_KEY: TfWwmWc13...
BUILD_ENV: sandbox
```

## Warnings

If required variables are missing, you'll see warnings:

```
⚠️  WARNING: PLATFORM_IDENTIFIER is not set!
   The extension may not work correctly without it.
   Set it via: export PLATFORM_IDENTIFIER=your-id
   Or create extension-files/test-extension/.env file
```

The build will continue but may not work correctly without these values.

## Tips

- **Security**: Never commit `.env` or `.env.local` files to version control
- **Team Setup**: Share a template `.env.example` file with your team
- **CI/CD**: Set environment variables in your CI/CD pipeline
- **Development**: Use `.env` files for local development
- **Production**: Use environment variables or secrets management in production builds
