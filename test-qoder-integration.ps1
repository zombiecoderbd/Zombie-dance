# Qoder Integration Test Script for Windows PowerShell

Write-Host "🧪 Testing Qoder Integration with ZombieCoder Proxy" -ForegroundColor Green
Write-Host ""

# Test 1: Proxy Health Check
Write-Host "1. Testing Proxy Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5010/proxy/health" -Method Get
    Write-Host "✅ Proxy Health Status: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Proxy Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Qoder Configuration
Write-Host ""
Write-Host "2. Testing Qoder Configuration Endpoint..." -ForegroundColor Yellow
try {
    $config = Invoke-RestMethod -Uri "http://localhost:5010/proxy/qoder-config" -Method Get
    Write-Host "✅ Qoder Configuration Available" -ForegroundColor Green
    Write-Host "   Base URL: $($config.openaiCompatible.baseUrl)" -ForegroundColor Cyan
    Write-Host "   Model: $($config.openaiCompatible.modelName)" -ForegroundColor Cyan
    Write-Host "   Proxy: $($config.proxySettings.httpProxy)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Configuration Endpoint Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Chat Endpoint
Write-Host ""
Write-Host "3. Testing Chat Endpoint..." -ForegroundColor Yellow
try {
    $body = @{
        messages = @(@{role="user"; content="Hello Qoder! This is a PowerShell test."})
        modelId = 6
    } | ConvertTo-Json -Depth 10
    
    $response = Invoke-RestMethod -Uri "http://localhost:5010/v1/chat" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ Chat Test Successful" -ForegroundColor Green
    Write-Host "   Response: $($response.response.Substring(0, [Math]::Min(50, $response.response.Length)))..." -ForegroundColor Cyan
    Write-Host "   Model: $($response.model)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Chat Test Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Models Endpoint
Write-Host ""
Write-Host "4. Testing Models Endpoint..." -ForegroundColor Yellow
try {
    $models = Invoke-RestMethod -Uri "http://localhost:5010/api/models" -Method Get
    Write-Host "✅ Models Endpoint Working" -ForegroundColor Green
    Write-Host "   Available Models: $($models.Count)" -ForegroundColor Cyan
    if ($models.Count -gt 0) {
        Write-Host "   First Model: $($models[0].name)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Models Test Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Qoder Integration Test Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Configuration Instructions for Qoder:" -ForegroundColor Yellow
Write-Host "1. Set OPENAI_BASE_URL=http://localhost:5010/v1" -ForegroundColor Cyan
Write-Host "2. Set OPENAI_API_KEY=your-api-key-here" -ForegroundColor Cyan
Write-Host "3. Or configure HTTP proxy to http://localhost:5010" -ForegroundColor Cyan
Write-Host "4. Test connection using the endpoints above" -ForegroundColor Cyan
Write-Host ""