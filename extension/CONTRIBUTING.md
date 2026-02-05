# Contributing to Zombie AI Assistant

Thank you for your interest in contributing to Zombie AI Assistant! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- VS Code 1.85.0 or higher
- Git

### Setup Development Environment

1. Fork and clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/TypeScript-extensions-VS-Code.git
cd TypeScript-extensions-VS-Code
\`\`\`

2. Install dependencies:
\`\`\`bash
# Extension
cd extension
npm install

# Backend
cd ../backend
npm install
\`\`\`

3. Build the project:
\`\`\`bash
# Extension
cd extension
npm run compile

# Backend
cd ../backend
npm run build
\`\`\`

## Development Workflow

### Running the Extension

1. Open the `extension/` folder in VS Code
2. Press `F5` to launch Extension Development Host
3. Test your changes in the new window

### Running the Backend

\`\`\`bash
cd backend
cp .env.example .env
# Edit .env with your API keys
npm run dev
\`\`\`

### Making Changes

1. Create a feature branch:
\`\`\`bash
git checkout -b feature/your-feature-name
\`\`\`

2. Make your changes following our coding standards

3. Test thoroughly:
\`\`\`bash
npm test
npm run lint
\`\`\`

4. Commit with clear messages:
\`\`\`bash
git commit -m "feat: add new feature description"
\`\`\`

### Commit Message Format

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Provide type annotations for function parameters and return values
- Avoid `any` types when possible
- Use meaningful variable and function names

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use double quotes for strings
- Maximum line length: 120 characters
- Run `npm run lint` before committing

### Documentation

- Add JSDoc comments for public APIs
- Update README.md for user-facing changes
- Update CHANGELOG.md following Keep a Changelog format

## Testing

### Writing Tests

- Write unit tests for new features
- Maintain or improve code coverage
- Test edge cases and error conditions

### Running Tests

\`\`\`bash
# Extension tests
cd extension
npm test

# Backend tests
cd backend
npm test

# With coverage
npm run test:coverage
\`\`\`

## Pull Request Process

1. Update documentation for any user-facing changes
2. Add tests for new functionality
3. Ensure all tests pass and linting is clean
4. Update CHANGELOG.md with your changes
5. Create a pull request with a clear description
6. Link any related issues

### PR Description Template

\`\`\`markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Checklist
- [ ] Tests pass
- [ ] Linting passes
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
\`\`\`

## Project Structure

\`\`\`
zombie-extension/
├── extension/              # VS Code extension
│   ├── src/
│   │   ├── extension.ts           # Entry point
│   │   ├── chatParticipant.ts     # Chat handler
│   │   ├── services/              # Core services
│   │   └── types/                 # TypeScript types
│   └── resources/                 # Icons and assets
│
└── backend/               # Agent server
    ├── src/
    │   ├── server.ts              # Express server
    │   ├── routes/                # API routes
    │   ├── services/              # Business logic
    │   ├── middleware/            # Express middleware
    │   └── utils/                 # Utilities
    └── tests/                     # Test files
\`\`\`

## Areas for Contribution

### High Priority
- WebSocket streaming implementation
- Inline code completions
- Multi-file refactoring support
- Improved error handling

### Medium Priority
- Additional LLM provider support
- Custom prompt templates
- Performance optimizations
- Better diff visualization

### Documentation
- Tutorial videos
- Example use cases
- API documentation
- Troubleshooting guides

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions or ideas
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Zombie AI Assistant!
\`\`\`
