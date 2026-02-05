# ZombieCoder Admin Panel - Testing & Verification Guide

## Testing Objectives

1. **No Mock Data Verification** - All responses are real-time data
2. **Real-Time Functionality** - Metrics update every 2 seconds
3. **Ollama Default Configuration** - Ollama loads as default provider
4. **VSIX Packaging** - Extension builds without errors
5. **Provider Integration** - All providers properly configured
6. **User Interface** - All panels responsive and functional

## Test Categories

### 1. Dashboard Tests
- [ ] Real-time metrics display correctly
- [ ] Data updates every 2 seconds
- [ ] Activity log shows real events
- [ ] Status indicators are accurate

### 2. Extension Management Tests
- [ ] Extensions list loads correctly
- [ ] Enable/Disable toggles work
- [ ] Installation form functions
- [ ] Extension health monitoring works

### 3. Provider Configuration Tests
- [ ] Ollama loads as default
- [ ] Provider list displays all options
- [ ] Connectivity testing works
- [ ] API key management is secure
- [ ] Model auto-discovery functions

### 4. User Management Tests
- [ ] User list displays correctly
- [ ] Role assignment works
- [ ] Status toggle functions
- [ ] User creation form works

### 5. Monitoring System Tests
- [ ] Real-time CPU monitoring
- [ ] Memory usage tracking
- [ ] Request counting accurate
- [ ] Error rate calculation correct
- [ ] Provider health checks work

### 6. UI/UX Tests
- [ ] Sidebar navigation works
- [ ] Mobile responsive layout
- [ ] Dark/Light theme toggle (if enabled)
- [ ] Form validation present
- [ ] Error messages display correctly

## Running Tests

### Start Development Server
```bash
npm run dev
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm test -- --testPathPattern=admin
```

### Test With Coverage
```bash
npm test -- --coverage
```

## Test Verification Checklist

### Real-Time Data Verification
```
Dashboard Metrics:
- Server Status: [ ] Real-time detection
- System Load: [ ] Actual CPU/Memory readings
- Active Connections: [ ] Real connection count
- Request Rate: [ ] Actual request tracking
- Response Time: [ ] Real latency measurement
- Error Rate: [ ] Real error tracking
```

### Ollama Default Verification
```
On First Launch:
- [ ] Ollama auto-detected at localhost:11434
- [ ] Default provider set to Ollama
- [ ] Available models loaded automatically
- [ ] Connection status shows 'Connected'
- [ ] User can easily switch to other providers
```

### VSIX Packaging Verification
```
Build Process:
- [ ] No compilation errors
- [ ] All dependencies included
- [ ] Icon assets included
- [ ] Package.json valid
- [ ] VSIX file generated successfully
- [ ] Extension installs without errors
```

## Performance Benchmarks

### Expected Performance
- Dashboard load time: < 2 seconds
- Metric update interval: 2 seconds
- Provider health check: 30 seconds
- Database query: < 100ms
- API response: < 500ms

### Performance Verification
```bash
npm run perf-test
```

## Security Testing

### Verification Points
- [ ] No hardcoded API keys
- [ ] Password fields use input type='password'
- [ ] API keys stored securely
- [ ] User sessions properly managed
- [ ] CORS properly configured
- [ ] SQL injection prevention
- [ ] XSS protection enabled

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

## Accessibility Testing

- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Focus indicators visible

## Test Results Template

```
Test Suite: [Name]
Date: [Date]
Tester: [Name]
Status: [PASSED/FAILED]

Results:
- Total Tests: [#]
- Passed: [#]
- Failed: [#]
- Skipped: [#]

Issues Found:
1. [Issue description]
2. [Issue description]

Sign-Off: [Signature]
```

## Continuous Integration

Tests automatically run on:
- Every code commit
- Pull requests
- Scheduled daily builds
- Before VSIX packaging

## Next Steps

After verification:
1. Generate VSIX file
2. Test VSIX installation
3. Verify functionality post-install
4. Deploy to production
5. Monitor for issues

---

**Verification Date:** [To be filled]
**Verified By:** [To be filled]
**Status:** [PENDING/PASSED/FAILED]
