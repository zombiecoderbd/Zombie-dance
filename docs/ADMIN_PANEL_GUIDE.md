# ZombieCoder Admin Panel - Complete Guide

## Overview

The ZombieCoder Admin Panel is a comprehensive management interface for the ZombieCursor AI extension system. It provides real-time monitoring, configuration management, and system administration capabilities.

## System Requirements

- Node.js 18+ or higher
- Next.js 15+
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Ollama running on localhost:11434 (for default AI provider)

## Features

### Dashboard
- Real-time system metrics and performance indicators
- Server health status monitoring
- Activity log tracking
- Response time and error rate monitoring

### Extension Management
- Install, enable, and disable extensions
- Configure extension settings
- Monitor extension health and performance
- View extension descriptions and versions

### Provider Configuration
- Manage AI provider connections
- Configure API endpoints and authentication
- Set default provider (Ollama by default)
- Automatic model discovery
- Provider connectivity testing

### User Management
- Create and manage user accounts
- Assign roles (Admin, Developer, Viewer)
- Control access permissions
- Track user activity and login history

### Monitoring
- Real-time system resource monitoring
- CPU and memory usage tracking
- Active request monitoring
- Provider health status checks
- Error rate and performance analytics

## Default Configuration

### Ollama Setup
The system uses Ollama as the default AI language model on first launch.

**Default Ollama Configuration:**
- Endpoint: `http://localhost:11434`
- Status: Auto-detected on startup
- Available Models: `llama2`, `neural-chat`, `mistral`

**To use Ollama:**
1. Install Ollama from https://ollama.ai
2. Run Ollama locally: `ollama serve`
3. The system automatically detects and configures it

### Switching Providers
Users can easily switch to alternative providers:
1. Navigate to **Admin > Providers**
2. Click **Set Default** on the desired provider
3. Configure API keys and endpoints as needed

## Usage

### Accessing the Admin Panel
1. Launch the ZombieCursor extension
2. Navigate to the admin panel via the sidebar
3. Authenticate with your admin credentials

### Real-Time Monitoring
- Dashboard metrics update every 2 seconds
- System resource monitors show live data
- Provider health checks run automatically every 30 seconds
- Activity logs capture all system events

### Testing Providers
1. Go to **Providers** section
2. Click **Test Connection** for any provider
3. System validates endpoint and authentication
4. Models are automatically loaded on successful connection

## Testing

### Running Tests
```bash
npm test
```

### Test Coverage
- Admin panel UI components
- Real-time data collection
- Provider connectivity
- User authentication
- Extension management
- Monitoring functionality

### Test Results
All tests verify:
- Real data collection (no mock responses)
- Proper state management
- Component rendering
- API integration
- Error handling

## Troubleshooting

### Ollama Connection Issues
**Problem:** Ollama not detected
**Solution:**
1. Verify Ollama is running: `ollama serve`
2. Check endpoint: `http://localhost:11434`
3. Clear browser cache
4. Restart extension

### Provider Connection Failures
**Problem:** Cannot connect to custom provider
**Solution:**
1. Verify endpoint URL is correct
2. Check API key is valid
3. Ensure CORS is enabled
4. Test connectivity from terminal: `curl -I https://api.example.com`

### High Resource Usage
**Problem:** CPU or memory usage exceeding 80%
**Solution:**
1. Reduce monitoring update frequency
2. Close unused extensions
3. Check provider health status
4. Restart system

## Performance Optimization

### Recommended Settings
- Update frequency: 2-5 seconds for Dashboard
- Health check interval: 30-60 seconds for Providers
- Maximum history items: 1000
- Cache size: 50MB

### Optimization Tips
1. Enable provider caching
2. Use connection pooling
3. Implement request batching
4. Monitor resource usage regularly

## Security

### Access Control
- Three-tier role system (Admin, Developer, Viewer)
- Permission-based feature access
- User activity logging
- Session timeout: 30 minutes of inactivity

### Best Practices
- Change default admin password
- Use strong API keys for providers
- Regularly review user access
- Monitor for unauthorized access
- Keep system updated

## Advanced Features

### Custom Providers
You can add custom AI providers:
1. Configure endpoint and API key
2. System auto-discovers available models
3. Models become available in UI
4. Configure provider priority and fallback

### LSP/DAP Support
The admin panel supports Language Server Protocol (LSP) and Debug Adapter Protocol (DAP) integration for advanced debugging and development features.

## Support

For issues and questions:
- Check troubleshooting section
- Review system logs
- Contact support team
- Visit documentation wiki

---

**Last Updated:** 2026
**Version:** 2.0.0
