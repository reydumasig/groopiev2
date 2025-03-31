# Contributing to Groopie

Thank you for your interest in contributing to Groopie! This document provides guidelines and instructions for contributing.

## Development Process

1. **Fork & Clone**
   ```bash
   git clone https://github.com/yourusername/groopieslack.git
   cd groopieslack
   ```

2. **Branch**
   - Feature: `feature/description`
   - Fix: `fix/description`
   - Docs: `docs/description`

3. **Development Guidelines**
   - Follow the [Development Checklist](docs/DEVELOPMENT_CHECKLIST.md)
   - Adhere to our [Style Guide](docs/STYLE_GUIDE.md)
   - Review [Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md)

4. **Commit Messages**
   ```
   type(scope): description
   
   - feat: New feature
   - fix: Bug fix
   - docs: Documentation
   - style: Formatting
   - refactor: Code restructuring
   - test: Tests
   - chore: Maintenance
   ```

5. **Testing**
   - Write tests for new features
   - Ensure all tests pass
   - Check code coverage

6. **Documentation**
   - Update relevant documentation
   - Add inline comments where needed
   - Update changelog if applicable

7. **Pull Request Process**
   - Create PR against `staging` branch
   - Fill out PR template
   - Request review from maintainers
   - Address review comments

## Code Standards

### TypeScript
- Use strict mode
- Proper type definitions
- No `any` types without justification

### React
- Functional components
- Proper hook usage
- Component documentation

### Testing
- Jest for unit tests
- Cypress for E2E tests
- Maintain test coverage

## Review Process

1. **Automated Checks**
   - Linting
   - Type checking
   - Test coverage
   - Build verification

2. **Manual Review**
   - Code quality
   - Documentation
   - Performance impact
   - Security considerations

## Getting Help

- Check existing documentation
- Open an issue for questions
- Join our development discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License. 