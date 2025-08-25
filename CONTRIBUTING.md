# Contributing to Fluid Background

Thank you for your interest in contributing to the Fluid Background project! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git
- Modern browser with WebGL support

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/fluid-background.git
   cd fluid-background
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## 🏗️ Project Structure

```
fluid-background/
├── src/
│   ├── FluidBackground.tsx      # Main component
│   ├── hooks/                   # React hooks
│   ├── simulation/              # WebGL simulation classes
│   ├── shaders/                 # GLSL shader code
│   ├── utils/                   # Utility functions
│   └── types/                   # TypeScript definitions
├── docs/                        # Documentation
├── scripts/                     # Build and test scripts
└── examples/                    # Usage examples
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run build tests
npm run test:build
```

### Test Categories

- **Unit Tests**: Individual function and class testing
- **Integration Tests**: Component integration testing
- **Performance Tests**: WebGL performance validation
- **Build Tests**: Package export validation

### Writing Tests

```typescript
// Example test structure
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FluidBackground } from '../FluidBackground';

describe('FluidBackground', () => {
  it('should render without crashing', () => {
    const { container } = render(<FluidBackground />);
    expect(container.firstChild).toBeInTheDocument();
  });
  
  it('should handle WebGL context creation', () => {
    // Mock WebGL context
    const mockGetContext = vi.fn().mockReturnValue({});
    HTMLCanvasElement.prototype.getContext = mockGetContext;
    
    render(<FluidBackground />);
    expect(mockGetContext).toHaveBeenCalledWith('webgl2');
  });
});
```

## 📝 Code Style

### TypeScript Guidelines

- Use strict TypeScript configuration
- Provide comprehensive type definitions
- Prefer interfaces over types for object shapes
- Use meaningful variable and function names

```typescript
// Good
interface FluidSimulationConfig {
  physics: PhysicsParameters;
  performance: PerformanceSettings;
}

// Avoid
type Config = {
  p: any;
  perf: any;
};
```

### React Guidelines

- Use functional components with hooks
- Implement proper cleanup in useEffect
- Handle SSR compatibility
- Provide meaningful prop interfaces

```typescript
// Good
interface ComponentProps {
  colors?: ColorConfiguration;
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
}

function Component({ colors, onPerformanceUpdate }: ComponentProps) {
  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    };
  }, []);
}
```

### WebGL Guidelines

- Always check for WebGL support
- Implement proper error handling
- Clean up resources (textures, buffers, programs)
- Use consistent naming for shaders and uniforms

```typescript
// Good
class ShaderManager {
  private programs = new Map<string, WebGLProgram>();
  
  createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
    // Implementation with error handling
  }
  
  cleanup(): void {
    this.programs.forEach(program => {
      this.gl.deleteProgram(program);
    });
    this.programs.clear();
  }
}
```

## 🐛 Bug Reports

### Before Reporting

1. Check existing issues
2. Test with minimal reproduction case
3. Verify browser and device compatibility
4. Check console for error messages

### Bug Report Template

```markdown
**Bug Description**
A clear description of the bug.

**Reproduction Steps**
1. Go to '...'
2. Click on '....'
3. See error

**Expected Behavior**
What you expected to happen.

**Screenshots/Videos**
If applicable, add screenshots or videos.

**Environment**
- Browser: [e.g. Chrome 91]
- Device: [e.g. iPhone 12, Desktop]
- OS: [e.g. iOS 14, Windows 10]
- Package Version: [e.g. 1.0.0]

**Additional Context**
Any other context about the problem.
```

## ✨ Feature Requests

### Before Requesting

1. Check if feature already exists
2. Consider if it fits the project scope
3. Think about implementation complexity
4. Consider performance implications

### Feature Request Template

```markdown
**Feature Description**
A clear description of the feature.

**Use Case**
Describe the problem this feature would solve.

**Proposed Solution**
Describe how you envision this feature working.

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Any other context or screenshots.
```

## 🔧 Pull Requests

### Before Submitting

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Update documentation if needed
6. Follow the code style guidelines

### PR Guidelines

- **Title**: Use clear, descriptive titles
- **Description**: Explain what changes were made and why
- **Tests**: Include tests for new features
- **Documentation**: Update docs for API changes
- **Breaking Changes**: Clearly mark breaking changes

### PR Template

```markdown
**Description**
Brief description of changes.

**Type of Change**
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

**Testing**
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Manual testing completed

**Checklist**
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly marked)
```

## 📚 Documentation

### Types of Documentation

- **API Documentation**: Complete function and component references
- **Usage Examples**: Practical implementation examples
- **Performance Guides**: Optimization strategies
- **Troubleshooting**: Common issues and solutions

### Documentation Guidelines

- Use clear, concise language
- Provide working code examples
- Include TypeScript types
- Cover edge cases and gotchas
- Update with API changes

## 🎯 Development Focus Areas

### High Priority

- **Performance Optimization**: WebGL performance improvements
- **Mobile Support**: Better mobile device compatibility
- **Accessibility**: Enhanced accessibility features
- **Browser Compatibility**: Wider browser support

### Medium Priority

- **New Effects**: Additional fluid simulation effects
- **Configuration**: More customization options
- **Developer Experience**: Better debugging tools
- **Examples**: More usage examples

### Future Considerations

- **WebGPU Support**: Next-generation graphics API
- **Framework Support**: Vue.js, Svelte adapters
- **Advanced Physics**: More sophisticated simulation
- **Plugin System**: Extensible architecture

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- CHANGELOG.md for significant contributions
- GitHub releases for major features

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and community support
- **Documentation**: Check docs/ directory first
- **Examples**: See examples/ directory for usage patterns

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You

Thank you for contributing to Fluid Background! Your contributions help make this project better for everyone.