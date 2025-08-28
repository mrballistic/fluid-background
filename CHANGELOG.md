# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-XX

### BREAKING CHANGES
This is a major cleanup release that removes all non-functional code and focuses solely on the working FluidCursor component.

### Removed
- **SplashCursor Component**: Completely removed all SplashCursor related code, components, and examples
- **FluidBackground Component**: Removed FluidBackground component and related simulation classes
- **Unused Utilities**: Removed utility files and functions not used by FluidCursor
- **Broken Examples**: Removed all non-working example files and demos
- **Misleading Documentation**: Removed documentation for non-existent functionality
- **Unused Dependencies**: Cleaned up package.json to only include necessary dependencies
- **Test Files**: Removed test files for deleted components and functionality
- **Build Artifacts**: Cleaned up coverage reports and unnecessary build outputs

### Changed
- **Package Focus**: Package now exclusively provides FluidCursor component functionality
- **File Structure**: Simplified directory structure with FluidCursor as the main component
- **Documentation**: Completely rewritten to focus only on FluidCursor usage and API
- **Examples**: Streamlined to only include working FluidCursor demonstrations
- **Build System**: Optimized build configuration for simplified codebase

### Migration Guide
- **FluidCursor users**: No changes needed - component API remains the same
- **SplashCursor users**: Component has been removed - consider alternative cursor effect libraries
- **FluidBackground users**: Component has been removed - consider using FluidCursor or alternative fluid simulation libraries
- **Package imports**: Main FluidCursor import path remains unchanged

### Fixed
- Removed all broken and misleading code examples
- Eliminated confusion from non-working component exports
- Cleaned up package structure for better maintainability

## [1.0.0] - 2025-01-XX

### Added
- Initial release of fluid-background package
- Interactive WebGL-based fluid simulation component
- Full TypeScript support with comprehensive type definitions
- Automatic performance optimization and device detection
- Mobile-optimized rendering with responsive configurations
- Accessibility support including `prefers-reduced-motion` respect
- SSR-safe Next.js integration with app router support
- Comprehensive API for customizing colors, physics, and performance
- Built-in performance monitoring and automatic quality adjustment
- Battery-aware optimizations for mobile devices
- Multiple export formats (ESM, CommonJS, TypeScript declarations)

### Features
- **FluidBackground Component**: Main React component for fluid simulation
- **Color Customization**: Support for rainbow, monochrome, and custom color palettes
- **Physics Configuration**: Adjustable viscosity, density, pressure, curl, and interaction parameters
- **Performance Optimization**: Automatic resolution scaling and frame rate management
- **Interaction Control**: Configurable mouse and touch interactions
- **WebGL Utilities**: Comprehensive WebGL context management and error handling
- **Shader System**: Modular shader architecture with all fluid simulation passes
- **Responsive Design**: Automatic adaptation to different screen sizes and devices
- **Accessibility**: Full screen reader support and motion preference respect

### Documentation
- Complete API reference with examples
- Comprehensive usage examples and patterns
- Performance optimization guide
- Troubleshooting documentation
- TypeScript type definitions

### Browser Support
- Chrome/Edge 56+
- Firefox 51+
- Safari 15+
- Mobile Safari iOS 15+
- Chrome Mobile 56+

### Dependencies
- React 16.8+ (peer dependency)
- React DOM 16.8+ (peer dependency)
- Modern browser with WebGL support

## [Unreleased]

### Planned
- WebGPU support for next-generation performance
- Additional physics presets and effects
- Plugin system for custom render passes
- React Native support
- Vue.js and Svelte adapters
- Advanced particle systems
- 3D fluid simulation modes
- Audio-reactive fluid effects
- Performance analytics dashboard