# Testing and Verification Guide

## Unit Tests

### 1. Database Tests
```bash
npm test -- lib/db/init.test.ts
```
- Schema initialization
- User CRUD operations
- Model management
- Extension management

### 2. LLM Service Tests
```bash
npm test -- lib/llm/factory.test.ts
```
- Service factory creation
- Model availability checking
- Connection validation
- Response parsing

### 3. API Route Tests
```bash
npm test -- app/api/__tests__
```
- `/api/models` - GET/POST
- `/api/users` - CRUD operations
- `/api/extensions` - status management
- `/api/admin/metrics` - real data retrieval
- `/api/chat` - LLM integration

## Integration Tests

### Admin Panel Flow
1. Start application: `npm run dev`
2. Navigate to `http://localhost:3000/admin`
3. Verify dashboard loads with real metrics
4. Test adding provider in Providers tab
5. Verify model appears in dropdown
6. Test chat uses backend-controlled model

### Chat Integration
1. Open chat interface
2. Send message to AI
3. Verify response comes from selected model
4. Check no "No Provider Registered" error appears

### Database Verification
```bash
# Open SQLite database
sqlite3 data/zombiecoder.db

# Check tables exist
.tables

# Verify models table
SELECT * FROM models;

# Verify no mock data
SELECT COUNT(*) FROM users;
```

## Performance Tests

### Metrics API Response Time
```bash
curl -i http://localhost:3000/api/admin/metrics
# Should respond in < 100ms
```

### Chat Response Time
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
# Should respond in reasonable time (depends on model)
```

## Security Tests

1. Verify API keys are not logged
2. Check database queries use parameterization
3. Validate all user inputs
4. Test error messages don't expose internals

## Checklist Before Production

- [ ] All mock data removed
- [ ] Database tables created and populated
- [ ] At least one model added via admin panel
- [ ] Chat responds without errors
- [ ] Metrics dashboard shows real data
- [ ] No hardcoded endpoints or credentials
- [ ] Proper error handling for missing providers
- [ ] User roles enforced correctly
- [ ] Extension toggle functionality works
