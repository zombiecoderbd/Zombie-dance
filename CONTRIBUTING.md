# Contributing to ZombieCursor AI

Thank you for your interest in contributing to ZombieCursor! This document outlines our guidelines and process.

## Code of Conduct

We're committed to providing a welcoming and respectful environment. Please review our values:

- **Privacy First**: Never compromise user privacy
- **Local by Default**: Keep all processing local
- **Secure**: Follow security best practices
- **Respectful**: Treat all contributors fairly
- **Quality**: Maintain high code standards

## Getting Started

### 1. Fork & Clone

\`\`\`bash
git clone https://github.com/yourusername/TypeScript-extensions-VS-Code
cd TypeScript-extensions-VS-Code
\`\`\`

### 2. Create Feature Branch

\`\`\`bash
git checkout -b feature/your-feature-name
\`\`\`

### 3. Setup Development

\`\`\`bash
cd extension
npm install
npm run watch
\`\`\`

Press F5 to start debugging.

## Making Changes

### Code Style

- **TypeScript**: Strict mode enabled
- **Naming**: camelCase for functions, PascalCase for classes
- **Types**: No implicit `any`
- **Comments**: JSDoc for public APIs
- **Line Length**: Soft limit 100 chars

### Before Committing

\`\`\`bash
npm run lint
npm run compile
npm test
\`\`\`

### Commit Messages

\`\`\`
<type>: <subject>

<body>

Fixes #<issue>
\`\`\`

**Types**: feat, fix, docs, style, refactor, test, chore

Example:
\`\`\`
feat: add RAG search highlighting

Implements semantic search highlighting in editor
when RAG results are found.

Fixes #123
\`\`\`

## Pull Request Process

1. **Update**: `git pull origin main`
2. **Rebase**: Squash commits if needed
3. **Test**: Run full test suite
4. **Push**: `git push origin feature/your-feature`
5. **PR**: Create PR on GitHub with description

### PR Checklist

- [ ] Tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Compiles: `npm run compile`
- [ ] Documentation updated
- [ ] Types are strict
- [ ] No breaking changes documented
- [ ] Security reviewed

## Types of Contributions

### Bug Reports

Include:
- Reproduction steps
- Expected vs actual behavior
- Error logs (Extension Host output)
- VS Code version and OS
- Screenshot if visual issue

### Feature Requests

Describe:
- Use case and motivation
- Proposed solution
- Alternative solutions considered
- Examples or mockups

### Documentation

- Typo fixes
- Clarification improvements
- Missing documentation
- Better examples

### Code

- Bug fixes
- Performance improvements
- New features (discuss first)
- Test coverage

## Testing

### Running Tests

\`\`\`bash
npm test                    # All tests
npm test -- file.test.ts   # Specific test
npm run test:watch        # Watch mode
\`\`\`

### Writing Tests

\`\`\`typescript
describe("ComponentName", () => {
  it("should do something", () => {
    // Arrange
    const input = "test"
    
    // Act
    const result = processInput(input)
    
    // Assert
    expect(result).toBe("expected")
  })
})
\`\`\`

## Security & Privacy

### Important Principles

**Never**:
- Add code that sends data to external servers
- Implement tracking or analytics
- Store sensitive data insecurely
- Execute commands without permission
- Bypass safety mechanisms

**Always**:
- Store data locally by default
- Require explicit user consent
- Use VS Code's secure storage for secrets
- Validate all inputs
- Document security implications

### Security Review

For security changes:
1. Describe threat model
2. Explain mitigation
3. Test edge cases
4. Consider user experience

## Documentation

### Update These Files

- `README.md` - Feature description
- `QUICK_START.md` - Usage instructions
- `docs/ARCHITECTURE.md` - Technical details
- `docs/DEVELOPMENT.md` - Developer info
- `CHANGELOG.md` - Breaking changes

### Style Guide

- Clear, simple language
- Active voice
- Code examples for complex topics
- Keep it DRY

## Release Process

### Versioning

Follow SemVer: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward-compatible)
- **PATCH**: Bug fixes

### Release Checklist

- [ ] All tests pass
- [ ] Version updated in `package.json`
- [ ] `CHANGELOG.md` updated
- [ ] Security review completed
- [ ] Tag created: `git tag v1.0.0`
- [ ] Push tags: `git push --tags`

## Questions?

- GitHub Issues for bugs
- GitHub Discussions for questions
- Check existing documentation first

## License

By contributing, you agree your code is licensed under MIT.

---

Thank you for helping make ZombieCursor better!
