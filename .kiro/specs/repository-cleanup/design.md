# Design Document

## Overview

This design outlines a systematic approach to cleaning up the fluid-background repository by removing all non-functional code and focusing solely on the working FluidCursor component. The cleanup will transform this from a confused multi-component package into a focused, single-purpose fluid cursor library.

## Architecture

### Current State Analysis

The repository currently contains:
- **Working**: FluidCursor component with WebGL-based fluid simulation
- **Broken/Incomplete**: SplashCursor implementations, FluidBackground component, multiple conflicting examples
- **Confusing**: Package exports for non-working components, misleading documentation, excessive test files

### Target State

After cleanup, the repository will contain:
- Single working FluidCursor component
- Minimal supporting utilities and types
- Clean package structure with accurate exports
- Focused documentation and examples
- Streamlined build and test configuration

## Components and Interfaces

### Core Component Structure

```
src/
├── FluidCursor.tsx              # Main component (renamed from components/FluidCursor/)
├── types.ts                     # Essential types only
├── utils/                       # Only utilities used by FluidCursor
│   ├── webgl.ts                # WebGL utilities
│   └── math.ts                 # Math utilities
└── index.ts                    # Clean exports
```

### Package Structure

```
package.json                     # Simplified exports and dependencies
README.md                       # FluidCursor-focused documentation
examples/
├── basic-usage.html            # Simple FluidCursor demo
└── custom-props.html           # Customization example
docs/
└── API.md                      # FluidCursor API only
```

### Removed Components

The following will be completely removed:
- All SplashCursor related files (`src/splash-cursor/`, `src/components/SplashCursor/`)
- FluidBackground component (`src/FluidBackground.tsx`)
- All simulation classes (`src/simulation/`) - FluidCursor has its own embedded implementation
- Unused utilities (`src/utils/` files not used by FluidCursor)
- Broken examples and test files
- Coverage reports and build artifacts

## Data Models

### Simplified Type Definitions

```typescript
// Only essential types for FluidCursor
export interface FluidCursorProps {
  SIM_RESOLUTION?: number;
  DYE_RESOLUTION?: number;
  DENSITY_DISSIPATION?: number;
  VELOCITY_DISSIPATION?: number;
  PRESSURE?: number;
  CURL?: number;
  SPLAT_RADIUS?: number;
  SPLAT_FORCE?: number;
  SHADING?: boolean;
  COLOR_UPDATE_SPEED?: number;
  BACK_COLOR?: ColorRGB;
  TRANSPARENT?: boolean;
}

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}
```

### Package Exports

```json
{
  "name": "fluid-cursor",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.esm.js",
      "require": "./dist/index.js"
    }
  }
}
```

## Error Handling

### Build System Error Prevention

- Remove all references to deleted files from build configuration
- Update TypeScript paths to only include existing files
- Clean up test configuration to avoid testing non-existent components

### Runtime Error Prevention

- Ensure FluidCursor component has proper WebGL fallbacks
- Maintain existing error handling within the working component
- Remove error handling for deleted components

## Testing Strategy

### Simplified Test Suite

```
__tests__/
├── FluidCursor.test.tsx        # Component functionality tests
├── webgl-utils.test.ts         # WebGL utility tests
└── integration.test.ts         # Basic integration test
```

### Test Coverage Goals

- Focus on FluidCursor component functionality
- Test WebGL context creation and shader compilation
- Verify prop handling and component lifecycle
- Remove all tests for deleted components

### Performance Testing

- Keep existing FluidCursor performance benchmarks
- Remove performance tests for deleted components
- Ensure cleanup doesn't impact FluidCursor performance

## Implementation Strategy

### Phase 1: Analysis and Preparation

1. **Dependency Analysis**: Identify which files are actually used by FluidCursor
2. **Export Analysis**: Determine what the package should actually export
3. **Documentation Review**: Identify accurate vs misleading documentation

### Phase 2: Systematic Removal

1. **Component Removal**: Delete SplashCursor and FluidBackground components
2. **Utility Cleanup**: Remove unused utility files and functions
3. **Test Cleanup**: Delete tests for removed components
4. **Example Cleanup**: Remove broken or misleading examples

### Phase 3: Restructuring

1. **File Organization**: Move FluidCursor to root level, simplify structure
2. **Package Configuration**: Update package.json, build configs, and exports
3. **Documentation Rewrite**: Create focused documentation for FluidCursor only

### Phase 4: Validation

1. **Build Verification**: Ensure package builds correctly with new structure
2. **Test Validation**: Verify all remaining tests pass
3. **Example Testing**: Confirm examples work with cleaned package
4. **Integration Testing**: Test package installation and usage

## Migration Considerations

### Breaking Changes

- Package name change from `fluid-background` to `fluid-cursor`
- Removal of SplashCursor and FluidBackground exports
- Simplified import paths
- Reduced package size and dependencies

### Backward Compatibility

- FluidCursor component API remains unchanged
- Existing FluidCursor implementations will continue to work
- Props and behavior are preserved

### Migration Path

Users currently using only FluidCursor:
```typescript
// Before
import { FluidCursor } from 'fluid-background';

// After  
import FluidCursor from 'fluid-cursor';
```

Users using other components:
- Will need to find alternative packages
- Clear deprecation notices will be provided
- Migration guide will suggest alternatives

## Quality Assurance

### Code Quality Metrics

- Maintain or improve TypeScript strict mode compliance
- Ensure ESLint passes on all remaining code
- Verify no unused imports or dead code remains

### Performance Metrics

- Package size should be significantly reduced
- Build time should improve
- FluidCursor performance should remain unchanged

### Documentation Quality

- All documentation should be accurate and up-to-date
- Examples should be tested and working
- API documentation should be complete for remaining functionality

## Rollback Plan

### Version Control Strategy

- Create feature branch for cleanup work
- Tag current state before beginning cleanup
- Maintain ability to revert to previous package structure if needed

### Incremental Approach

- Implement cleanup in small, reviewable commits
- Test after each major removal phase
- Maintain working state throughout process

This design ensures a systematic, safe approach to cleaning up the repository while preserving the working FluidCursor functionality and creating a focused, maintainable package.