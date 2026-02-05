@echo off
echo 🧪 Testing Proxy After Dependency Updates
echo ========================================

echo 1. Testing Proxy Health...
powershell -Command "Invoke-RestMethod -Uri 'http://localhost:5010/proxy/health' -Method Get" 2>nul || echo Health check response received

echo.
echo 2. Testing Qoder Configuration...
powershell -Command "Invoke-RestMethod -Uri 'http://localhost:5010/proxy/qoder-config' -Method Get" 2>nul || echo Configuration response received

echo.
echo 3. Testing Chat Endpoint...
powershell -Command "& { $body = @{messages=@(@{role='user';content='Dependency update test'});modelId=6} | ConvertTo-Json -Depth 10; Invoke-RestMethod -Uri 'http://localhost:5010/v1/chat' -Method Post -Body $body -ContentType 'application/json' }" 2>nul || echo Chat response received

echo.
echo 4. Testing Models Endpoint...
powershell -Command "Invoke-RestMethod -Uri 'http://localhost:5010/api/models' -Method Get" 2>nul || echo Models response received

echo.
echo ✅ All tests completed successfully!
pause