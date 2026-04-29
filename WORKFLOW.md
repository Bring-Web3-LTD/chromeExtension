# GitHub Actions Workflows

## deploy-iframe.yml — Deploy Iframe Frontend

Deploys the iframe frontend to AWS (S3 + CloudFront).

### Trigger

- **`workflow_dispatch` only** — must be triggered manually from the GitHub Actions UI.
- **Main branch only** — the workflow hard-fails if run from any other branch.
- There is no `target_environment` input. The deploy environment is controlled by the `DEPLOY_ENV` repo secret (e.g. `prod` or `automation`).

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `deployment_mode` | choice | `override` | `override` — rebuild & replace the latest version in S3. `new_version` — deploy a new version (read from SDK `package.json`). |

### What it does

1. **Checkout & setup** — Node.js + Yarn cache
2. **AWS credentials** — OIDC via `AWS_ROLE_ARN` secret
3. **Determine version** — `new_version` reads from `extension-files/bringweb3-sdk/package.json`; `override` finds the latest `vX.Y.Z` folder in S3 under `DEPLOY_ENV/`
4. **Build** — runs `scripts/build.sh --iframe-only` (passes `DEPLOY_ENV` as positional arg for non-prod envs)
5. **Upload to S3** — syncs `iframe-frontend/dist/` to `s3://{BUCKET}/{DEPLOY_ENV}/v{VERSION}/`
6. **Update CloudFront KVS** — rebuilds the version list for the `DEPLOY_ENV` key
7. **Invalidate CloudFront** — invalidates `/{DEPLOY_ENV}/v{VERSION}/*`
8. **Summary** — writes a deployment summary to the GitHub step summary

### Required secrets

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_ARN` | IAM OIDC role ARN for GitHub Actions |
| `S3_BUCKET` | Target S3 bucket name |
| `CLOUDFRONT_ID` | CloudFront distribution ID |
| `CLOUDFRONT_KVS_ARN` | CloudFront KeyValueStore ARN |
| `DEPLOY_ENV` | Environment prefix in S3 (`prod`, `automation`, etc.) |
| `VITE_API_KEY` | API key passed to the iframe build |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics measurement ID |
| `VITE_TEST_ID` | Test identifier |

---

## main.yml — CI-SDK

Runs SDK lint & build. Trigger: `workflow_dispatch` only.

---

## publish.yml — Publish SDK to NPM

Triggered by successful completion of CI-SDK. Publishes the SDK package via changesets.