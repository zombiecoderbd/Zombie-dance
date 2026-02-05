# Troubleshooting Guide

## Common Issues

### 1. Extension Won't Load

**Symptom**: Extension not showing in VS Code

**Solutions**:
```bash
# Check extension installation
code --list-extensions | grep zombie

# Reinstall
code --uninstall-extension zombiecoder.zombie-ai-assistant
code --install-extension dist/zombie-ai-assistant-2.0.0.vsix
```

### 2. API Connection Failed

**Symptom**: "Failed to connect to backend" error

**Check**:
1. Backend running: `curl http://localhost:8001/v1/health`
2. Firewall settings
3. Endpoint URL correct in settings

**Fix**:
```bash
# Restart backend
# On Windows
.\scripts\build-all.bat

# On Linux/Mac
./scripts/build-all.sh
```

### 3. API Key Not Working

**Symptom**: "Invalid API key" or authentication errors

**Solutions**:
1. Verify key copied correctly (no spaces)
2. Check key has correct permissions
3. Ensure key is for correct provider
4. Recreate API key in provider console

```bash
# Test OpenAI key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-..." \
  -H "Content-Type: application/json"
```

### 4. Out of Memory / Slow Performance

**Symptoms**: Freezing, high CPU usage, slow indexing

**Solutions**:
```bash
# Exclude large directories from RAG
# In VS Code Settings, set zombie.excludeSensitive:
[
  ".env",
  "node_modules",
  ".git",
  "dist",
  "build",
  "*.min.js",
  "*.bundle.js"
]

# Or reduce context size
zombie.contextSizeBytes: 10240  # 10KB instead of 20KB
```

### 5. RAG Index Not Working

**Symptom**: "No relevant context found"

**Solutions**:
```bash
# Clear index
rm -rf .zombiecoder/vectordb

# Reindex project (click index button)
# Wait for indexing to complete

# Check supported file types in docs/CONFIG.md
```

### 6. Terminal Commands Failing

**Symptom**: "Command denied by security policy"

**Solutions**:
1. Enable terminal permissions: Settings > `zombie.allowTerminalCommands`
2. Check dangerous command list in security docs
3. Manually execute risky commands

### 7. Chat Input Not Working

**Symptom**: Text won't type or send button disabled

**Solutions**:
```bash
# Clear cache
rm -rf ~/.zombiecoder/cache

# Restart VS Code (Ctrl+Shift+P > Developer: Reload Window)

# Check textarea not focused on hidden element
```

### 8. File Not Found / Import Errors

**Symptom**: "Module not found" or 404 errors

**Solutions**:
```bash
# Reinstall dependencies
cd extension
npm install
npm run compile

# Check paths are correct
# Ensure files exist in project
```

### 9. Docker Issues

**Symptom**: Container won't start or connection refused

**Solutions**:
```bash
# Check Docker running
docker ps

# View logs
docker logs zombiecoder-backend

# Restart container
docker restart zombiecoder-backend

# Rebuild image
docker-compose build --no-cache
```

### 10. Windows Specific Issues

**npm: not found**
- Reinstall Node.js from nodejs.org

**Powershell execution policy**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Path issues**
- Use backslashes: `.\scripts\build-all.bat`
- Or use forward slashes: `./scripts/build-all.sh` in Git Bash

## Getting Support

1. **Check existing issues**: GitHub Issues
2. **Read documentation**: docs/ folder
3. **Contact**: infi@zombiecoder.my.id

## Debug Mode

Enable verbose logging:

```bash
# In VS Code Terminal
export DEBUG=zombie:*
code .

# Or in .env
LOG_LEVEL=debug
```

Then check Output panel (View > Output) for "ZombieCoder" logs.

## Performance Tuning

```json
// settings.json for better performance
{
  "zombie.contextSizeBytes": 15360,
  "zombie.ragTopK": 3,
  "zombie.animationSpeed": 100,
  "zombie.autosaveOnApply": false,
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 2000
}
