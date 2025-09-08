# Branch Sync Workflow

## Problem Solved

Previously, changeset `.md` files accumulated in dev/sandbox branches because they weren't synced back after production releases. This caused incorrect version calculations when deploying to sandbox.

## New Workflow

### Automatic Sync
After each production release (when SDK version changes in main):
1. **Sync workflow automatically triggers** 
2. **Merges main → dev** (removes processed changesets)
3. **Merges main → sandbox** (removes processed changesets)
4. **Clean branches** ready for next development cycle

### Manual Sync
You can also manually trigger the sync:
```bash
# Via GitHub Actions UI
Actions → Sync Main to Dev Branches → Run workflow
```

## Branch States

### Before (Problematic)
```
main: v1.2.0 (changesets A,B,C processed & deleted)
sandbox: v1.1.0 + changesets A,B,C,D,E (accumulated!)
         ↳ Version calculation: v1.2.0 + all 5 changesets = wrong!
```

### After (Clean)
```
main: v1.2.0 (changesets A,B,C processed & deleted)  
sandbox: v1.2.0 + changesets D,E (synced from main)
         ↳ Version calculation: v1.2.0 + 2 new changesets = correct!
```

## Your Development Flow

1. **Develop** on `dev` branch
2. **Test** by pushing to `sandbox` 
3. **Release** by pushing to `main`
4. **Auto-sync** happens after main release ✨
5. **Continue** development on clean branches

## Files Changed

- ✅ **Reverted** complex changeset filtering in `deploy-iframe.yml`
- ✅ **Added** `sync-branches.yml` workflow
- ✅ **Updated** test script (can be deleted now)

## Manual Sync Commands

If you need to sync manually:

```bash
# Sync dev branch
git checkout dev
git pull origin main
git push origin dev

# Sync sandbox branch  
git checkout sandbox
git pull origin main
git push origin sandbox
```

## Benefits

- ✅ **No more changeset accumulation**
- ✅ **Accurate version calculations** 
- ✅ **Cleaner git history**
- ✅ **Automated process**
- ✅ **Handles merge conflicts gracefully**
- ✅ **Manual fallback available**