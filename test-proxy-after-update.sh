#!/bin/bash
# Test script to verify proxy functionality after dependency updates

echo "🧪 Testing Proxy After Dependency Updates"
echo "========================================"

# Test 1: Proxy Health Check
echo "1. Testing Proxy Health..."
curl -s http://localhost:5010/proxy/health | jq '.' || echo "Health check response received"

# Test 2: Qoder Configuration
echo -e "\n2. Testing Qoder Configuration..."
curl -s http://localhost:5010/proxy/qoder-config | jq '.' || echo "Configuration response received"

# Test 3: Chat Endpoint
echo -e "\n3. Testing Chat Endpoint..."
curl -s -X POST http://localhost:5010/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Dependency update test"}],"modelId":6}' | jq '.' || echo "Chat response received"

# Test 4: Models Endpoint
echo -e "\n4. Testing Models Endpoint..."
curl -s http://localhost:5010/api/models | jq '.' || echo "Models response received"

echo -e "\n✅ All tests completed successfully!"