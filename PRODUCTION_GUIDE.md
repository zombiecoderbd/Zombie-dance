# Production Deployment Guide

## System Requirements

### Minimum
- CPU: 2 cores
- RAM: 2GB
- Storage: 500MB
- Network: 100Mbps

### Recommended
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 5GB SSD
- Network: 1Gbps

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Security audit completed
- [ ] API keys configured
- [ ] Database backups enabled
- [ ] Monitoring setup
- [ ] Logging configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured

## Docker Deployment

```bash
# Build image
docker build -t zombiecoder-backend:latest backend/

# Run container
docker run -d \\
  -p 8001:8001 \\
  -e OPENAI_API_KEY=sk-... \\
  -e API_KEY=your-key \\
  --name zombiecoder \\
  zombiecoder-backend:latest
```

## Environment Variables (Production)

```bash
# Security
API_KEY=<strong-random-key>
JWT_SECRET=<strong-random-secret>

# AI Configuration
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4

# Server
PORT=8001
NODE_ENV=production
LOG_LEVEL=warn

# Database
DB_TYPE=postgres
DB_URL=postgresql://...

# Monitoring
SENTRY_DSN=https://...
```

## Scaling Considerations

- Use load balancer for multiple instances
- Implement caching (Redis)
- Database connection pooling
- Rate limiting per user
- CDN for static assets

## Monitoring & Maintenance

See [MONITORING.md](./MONITORING.md) for:
- Health checks
- Performance metrics
- Error tracking
- Resource monitoring

## Rollback Procedures

```bash
# Keep previous version available
docker save zombiecoder-backend:v1.9.0 > backup.tar

# Quick rollback
docker load < backup.tar
docker run -d ... zombiecoder-backend:v1.9.0
```

## Security Hardening

1. Use HTTPS only
2. Enable rate limiting
3. Implement authentication
4. Use environment variables for secrets
5. Regular security updates
6. Monitor access logs
7. Implement backup strategy
