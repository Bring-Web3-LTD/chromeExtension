# Build Script Usage Guide

The `build.sh` script supports configurable environment variables via command-line arguments or .env files.

## Build Modes

### Full build (default)

Builds the SDK, test extension, and iframe frontend. All variables below are required.

### Iframe-only build (`--iframe-only`)

Builds only the iframe frontend. `PLATFORM_IDENTIFIER` and `WALLET_ADDRESS` are **not required**. This is the mode used by the CI deploy workflow.

## Required Variables

| Variable | Full build | `--iframe-only` |
|----------|-----------|------------------|
| `PLATFORM_IDENTIFIER` | ✅ Required | ❌ Not needed |
| `WALLET_ADDRESS` | ✅ Required | ❌ Not needed |
| `VITE_API_KEY` | ✅ Required | ✅ Required |

### Optional
- **BUILD_ENV** - Environment name for API routing (positional arg, e.g. `automation`)

## Available Flags

- `--identifier VALUE` - Sets PLATFORM_IDENTIFIER
- `--wallet VALUE` - Sets WALLET_ADDRESS
- `--iframe-api-key VALUE` - Sets VITE_API_KEY
- `--version VALUE` - Sets SDK_VERSION (skip reading from package.json)
- `--iframe-only` - Build only the iframe frontend (skips SDK & extension)

## Usage Methods

### Method 1: Command-Line Arguments (Recommended)

Pass variables directly in the build command:

```bash
# Production build with all options
./scripts/build.sh --identifier my-id --wallet addr1qy... --iframe-api-key my-key

# Production with just required values
./scripts/build.sh --identifier my-id --iframe-api-key my-key

# Custom environment with custom wallet
./scripts/build.sh danielk --identifier my-id --wallet custom-addr --iframe-api-key my-key
```

#### Iframe-only examples

```bash
# Build iframe only for production (version from package.json)
./scripts/build.sh --iframe-only --iframe-api-key my-key

# Build iframe only with explicit version
./scripts/build.sh --iframe-only --iframe-api-key my-key --version 1.6.4

# Build iframe only for a custom environment
./scripts/build.sh automation --iframe-only --iframe-api-key my-key --version 1.6.4
```

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
./scripts/build.sh danielk  # Custom environment
```

### Method 3: Environment Variables

```bash
# One-time build with specific values
PLATFORM_IDENTIFIER=my-id WALLET_ADDRESS=addr1qy... VITE_API_KEY=my-key ./scripts/build.sh

# Or export for multiple builds
export PLATFORM_IDENTIFIER=my-id
export WALLET_ADDRESS=addr1qy...
export VITE_API_KEY=my-key
./scripts/build.sh
```

### Method 4: Hybrid Approach

Command-line arguments take precedence over .env files:

```bash
# Use .env file values but override wallet address
./scripts/build.sh danielk --wallet different-address

# Use .env files but override API key
./scripts/build.sh --iframe-api-key different-key
```

**Priority Order** (highest to lowest):
1. Command-line arguments (`--iframe-api-key value`)
2. Environment variables (`export VITE_API_KEY=value`)
3. .env files

### Method 5: Mix and Match

Combine any of the above methods:

```bash
# Override WALLET_ADDRESS from .env file using an environment variable
WALLET_ADDRESS=different-address ./scripts/build.sh
```

## Examples

### Basic Production Build
```bash
# Using command-line arguments
./scripts/build.sh --identifier prod-id --iframe-api-key prod-key
```

### Environment-Specific Builds
```bash
# Development
./scripts/build.sh danielk --identifier dev-id --iframe-api-key dev-key

# Automation / Testing
./scripts/build.sh automation --identifier test-id --iframe-api-key test-key

# Production
./scripts/build.sh --identifier prod-id --iframe-api-key prod-key
```

### Using .env Files
```bash
# Just run build - reads from .env files
./scripts/build.sh
./scripts/build.sh danielk  # Custom environment
```

### Override One Value from .env
```bash
# Use .env for most values, override API key
./scripts/build.sh --iframe-api-key different-key
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
BUILD_ENV: (none)
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
- **CI/CD**: Use `--iframe-only` mode with secrets in your CI pipeline. See `deploy-iframe.yml` for reference.
- **Production**: Use environment variables or secrets management for production builds
- **Development**: Use `.env` files for local development
