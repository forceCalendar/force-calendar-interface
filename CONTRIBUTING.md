# Contributing to Force Calendar Interface

## Commit Message Conventions

This project uses **semantic versioning** controlled by commit message keywords. The CI/CD pipeline automatically determines the version bump based on your commit message.

### Version Bump Rules

| Keyword in Commit | Bump Type | Example Version Change |
|-------------------|-----------|------------------------|
| `fix:`, `bugfix:`, `hotfix:`, `[patch]` | **Patch** | 0.10.0 → 0.10.1 |
| `feat:`, `feature:`, `[minor]` | **Minor** | 0.10.0 → 0.11.0 |
| `BREAKING CHANGE`, `[major]`, `!:` | **Major** | 0.10.0 → 1.0.0 |
| *(no keyword)* | **Patch** | 0.10.0 → 0.10.1 |

### Commit Message Examples

```bash
# Patch release (bug fixes, small changes)
git commit -m "fix: resolve memory leak in BaseComponent"
git commit -m "[patch] correct typo in button label"
git commit -m "hotfix: Safari compatibility issue"

# Minor release (new features, enhancements)
git commit -m "feat: add drag-and-drop event support"
git commit -m "feature: implement recurring events"
git commit -m "[minor] add dark mode toggle"

# Major release (breaking changes)
git commit -m "[major] redesign public API"
git commit -m "BREAKING CHANGE: remove deprecated methods"
git commit -m "feat!: change event data structure"
```

### Skipping CI

To push changes without triggering a release (e.g., documentation updates):

```bash
git commit -m "Update readme [skip ci]"
```

### Manual Release

You can also trigger a release manually from GitHub Actions:

1. Go to **Actions** tab
2. Select **Auto Publish to NPM**
3. Click **Run workflow**
4. Choose bump type (patch/minor/major)

## Development Workflow

1. Always pull before pushing to stay in sync:
   ```bash
   git pull origin master
   ```

2. Make your changes and commit with appropriate keywords

3. Push to master:
   ```bash
   git push origin master
   ```

4. The CI/CD pipeline will automatically:
   - Run tests
   - Build the package
   - Bump version based on commit message
   - Publish to NPM
   - Create a GitHub release
