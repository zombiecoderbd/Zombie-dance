#!/bin/bash

# ZombieCoder Backend Test Suite
# Complete automated testing script for backend endpoints

set -e

BASE_URL="http://localhost:8001"
OLLAMA_URL="http://localhost:11434"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}Testing:${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓ PASS:${NC} $1"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}✗ FAIL:${NC} $1"
    ((TESTS_FAILED++))
}

test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}

    print_test "$name"

    response=$(curl -s -w "\n%{http_code}" "$url")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" -eq "$expected_status" ]; then
        print_success "$name (HTTP $http_code)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        print_error "$name (Expected HTTP $expected_status, got $http_code)"
        echo "$body"
    fi
    echo ""
}

# Start testing
clear
print_header "🧟‍♂️ ZombieCoder Backend Test Suite"

echo "Testing backend at: $BASE_URL"
echo "Testing Ollama at: $OLLAMA_URL"
echo ""

# Check if backend is running
print_test "Backend Server Connection"
if curl -s --connect-timeout 5 "$BASE_URL/v1/health" > /dev/null 2>&1; then
    print_success "Backend server is running"
else
    print_error "Backend server is not running on $BASE_URL"
    echo ""
    echo "Please start the backend server:"
    echo "  cd ~/zombiecoder/backend"
    echo "  npm run dev"
    exit 1
fi

echo ""

# Test 1: Health Check
print_header "Test 1: Health Check"
test_endpoint "Health Check Endpoint" "$BASE_URL/v1/health"

# Test 2: VS Code Info
print_header "Test 2: VS Code Integration Info"
test_endpoint "VS Code Info Endpoint" "$BASE_URL/v1/vscode/info"

# Test 3: Test Endpoint
print_header "Test 3: Simple Test Endpoint"
test_endpoint "Test Endpoint" "$BASE_URL/test"

# Test 4: Models API
print_header "Test 4: Models API"
test_endpoint "Models API Endpoint" "$BASE_URL/api/models"

# Test 5: Chat Models
print_header "Test 5: Chat Models (with Ollama)"
test_endpoint "Chat Models Endpoint" "$BASE_URL/v1/chat/models"

# Test 6: Runtime Status
print_header "Test 6: Runtime Status"
test_endpoint "Runtime Status Endpoint" "$BASE_URL/v1/runtime_status"

# Test 7: Ollama Service
print_header "Test 7: Ollama Service"
print_test "Ollama Service Connection"
if curl -s --connect-timeout 5 "$OLLAMA_URL/api/tags" > /dev/null 2>&1; then
    print_success "Ollama service is running"

    # Get Ollama models
    models=$(curl -s "$OLLAMA_URL/api/tags" | jq '.models | length')
    if [ "$models" -gt 0 ]; then
        print_success "Ollama has $models model(s) available"
        echo ""
        echo "Available Ollama models:"
        curl -s "$OLLAMA_URL/api/tags" | jq -r '.models[] | "  - \(.name) (\(.size / 1024 / 1024 | floor)MB)"'
    else
        print_error "No Ollama models found"
        echo "Please pull a model: ollama pull qwen2.5:0.5b"
    fi
else
    print_error "Ollama service is not running"
    echo "Please start Ollama: ollama serve"
fi

echo ""

# Test 8: WebSocket Endpoint
print_header "Test 8: WebSocket Endpoint"
print_test "WebSocket Connection Check"

# Try to upgrade to WebSocket
ws_response=$(curl -s -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: dGVzdA==" \
  --max-time 2 \
  "$BASE_URL/v1/chat/ws" 2>/dev/null | head -1)

if echo "$ws_response" | grep -q "101\|Switching Protocols"; then
    print_success "WebSocket endpoint is accessible"
else
    print_error "WebSocket endpoint failed to upgrade"
fi

echo ""

# Test 9: Database Health
print_header "Test 9: Database Health"
print_test "Database Status"

runtime_status=$(curl -s "$BASE_URL/v1/runtime_status")
db_status=$(echo "$runtime_status" | jq -r '.services.database.status')

if [ "$db_status" = "healthy" ]; then
    print_success "Database is healthy"
    models_count=$(echo "$runtime_status" | jq -r '.services.database.modelsConfigured')
    echo "  - Models configured: $models_count"
else
    print_error "Database is not healthy"
fi

echo ""

# Test 10: Memory Usage
print_header "Test 10: Memory & Performance"
print_test "Memory Usage"

memory_info=$(curl -s "$BASE_URL/v1/runtime_status")
memory_used=$(echo "$memory_info" | jq -r '.resources.memory.used')
memory_total=$(echo "$memory_info" | jq -r '.resources.memory.total')

if [ -n "$memory_used" ] && [ "$memory_used" != "null" ]; then
    print_success "Memory monitoring is working"
    echo "  - Used: ${memory_used}MB"
    echo "  - Total: ${memory_total}MB"

    usage_percent=$((memory_used * 100 / memory_total))
    if [ $usage_percent -lt 50 ]; then
        echo -e "  - ${GREEN}Memory usage is healthy (${usage_percent}%)${NC}"
    elif [ $usage_percent -lt 80 ]; then
        echo -e "  - ${YELLOW}Memory usage is moderate (${usage_percent}%)${NC}"
    else
        echo -e "  - ${RED}Memory usage is high (${usage_percent}%)${NC}"
    fi
else
    print_error "Could not retrieve memory information"
fi

echo ""

# Final Summary
print_header "📊 Test Summary"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=0

if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))
fi

echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Success Rate: ${BLUE}${SUCCESS_RATE}%${NC}"

echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Backend is fully operational.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the output above for details.${NC}"
    exit 1
fi
