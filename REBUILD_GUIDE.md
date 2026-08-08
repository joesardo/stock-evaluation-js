# Sector & Industry Rebuild Guide

## Problem Solved
Previously, when rebuilding sectors or industries separately, the other would get lost because:
- `--rebuild-sectors` would overwrite the cache, clearing industries
- `--rebuild-industries` would overwrite the cache, clearing sectors

## Solution: Unified Rebuild Command

### New Command
```bash
npm run dev -- --rebuild
```

This single command rebuilds **both sectors AND industries together**, ensuring they stay in sync and both are preserved in the cache.

### Implementation Details

1. **New `rebuildAll()` method** in `SectorBuilder`:
   - Builds sectors from Yahoo Finance data
   - Builds industries from Yahoo Finance data
   - Saves both to cache in one operation
   - Returns both results

2. **Improved caching logic**:
   - `getSectors()` now preserves industries when saving
   - `getIndustries()` now preserves sectors when saving
   - Only `rebuildAll()` clears and rebuilds everything

3. **CLI Updates**:
   - `--rebuild` (new, recommended) - Rebuilds both
   - `--rebuild-sectors` (legacy, now shows warning)
   - `--rebuild-industries` (legacy, now shows warning)

### Usage

```bash
# Recommended: Rebuild everything together
npm run dev -- --rebuild

# Legacy (still works, shows warning):
npm run dev -- --rebuild-sectors    # Only rebuilds sectors
npm run dev -- --rebuild-industries # Only rebuilds industries
```

### When to Use

- **First time setup**: Use `--rebuild` to build complete cache
- **Regular updates**: Use `--rebuild` to keep sectors and industries in sync
- **Minimal updates**: `--rebuild-sectors` or `--rebuild-industries` if you only need to refresh one (not recommended)

