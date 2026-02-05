# Change Log

All notable changes to the "Zombie AI Assistant" extension will be documented in this file.

## [1.0.0] - 2025-01-09

### Added
- Initial release of Zombie AI Assistant
- Chat participant integration with VS Code
- Real-time streaming responses via SSE
- Intelligent context extraction from workspace
- Smart diff application with visual preview
- Slash commands: /explain, /refactor, /fix, /optimize
- Context menu integration for selected code
- Secure API key storage using VS Code SecretStorage
- Automatic sensitive file exclusion
- Configurable LLM model selection
- Rate limiting and error handling
- Health check and connection testing
- Keyboard shortcut (Ctrl+Shift+Z / Cmd+Shift+Z)

### Features
- **AI Chat Interface**: Natural language interaction with your codebase
- **Streaming Responses**: Real-time feedback as AI generates responses
- **Context-Aware**: Automatically includes relevant workspace information
- **Diff Management**: Review and apply code changes with one click
- **Multiple LLM Support**: Works with GPT-4, Claude, and other models
- **Security First**: Encrypted API key storage and sensitive file filtering

### Configuration
- `zombie.endpoint`: Backend API endpoint URL
- `zombie.model`: LLM model selection
- `zombie.contextSizeBytes`: Maximum context size
- `zombie.excludeSensitive`: Patterns for sensitive files
- `zombie.streamTransport`: SSE or WebSocket
- `zombie.autosaveOnApply`: Auto-save after applying diffs

## [Unreleased]

### Planned Features
- WebSocket streaming support
- Inline code completions
- Multi-file refactoring
- Code review mode
- Custom prompt templates
- Team collaboration features
