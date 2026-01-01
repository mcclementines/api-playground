# Project Guidelines

## Git Workflow - REQUIRED

**All new features and changes must be done on feature branches.**

### Workflow Steps

1. **Always create a feature branch from develop:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/short-description
   ```

2. **Branch naming conventions:**
   - New features: `feature/description` (e.g., `feature/user-auth`)
   - Bug fixes: `fix/description` (e.g., `fix/login-error`)
   - Hotfixes: `hotfix/description`

3. **Commit message format:**
   - Use conventional commits: `type(scope): description`
   - Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
   - Example: `feat(auth): add JWT authentication`

4. **Pull requests:**
   - Push feature branch: `git push -u origin feature/your-branch`
   - Create PR targeting `develop` branch
   - Require at least one code review approval
   - Ensure all tests pass before merging

5. **Never commit directly to main or develop**

## Project Structure

- `api/` - API server implementation
- `api/cmd/server/` - Main server entry point
- `api/internal/handlers/` - HTTP request handlers
- `api/internal/config/` - Configuration management
- `api/internal/storage/` - Data storage layer
- `api/internal/proxy/` - Proxy client

## Development Commands

```bash
# Build
cd api && go build ./...

# Test
cd api && go test ./...

# Run server
cd api && go run cmd/server/main.go

# Format code
cd api && go fmt ./...
```

## Important Notes

- This is a Go project following standard Go project layout
- Always run tests before creating a PR
- Follow Go naming conventions (exported names are CamelCase)
- Update or add tests when modifying code
