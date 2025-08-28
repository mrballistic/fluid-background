/**
 * Spatial partitioning system for optimizing particle rendering
 * Uses a grid-based approach to quickly find nearby particles
 */

import { Particle, Vector2, Rectangle } from '../types/splash-cursor';

export interface SpatialGrid {
  cellSize: number;
  bounds: Rectangle;
  grid: Map<string, Particle[]>;
  particleToCell: Map<Particle, string>;
}

export class SpatialPartitioning {
  private grid: Map<string, Particle[]> = new Map();
  private particleToCell: Map<Particle, string> = new Map();
  private cellSize: number;
  private bounds: Rectangle;
  private gridWidth: number;
  private gridHeight: number;

  constructor(bounds: Rectangle, cellSize: number = 100) {
    this.bounds = bounds;
    this.cellSize = cellSize;
    this.gridWidth = Math.ceil(bounds.width / cellSize);
    this.gridHeight = Math.ceil(bounds.height / cellSize);
    this.clear();
  }

  /**
   * Clear all particles from the grid
   */
  clear(): void {
    this.grid.clear();
    this.particleToCell.clear();
  }

  /**
   * Add a particle to the spatial grid
   */
  addParticle(particle: Particle): void {
    const cellKey = this.getCellKey(particle.position);
    
    // Remove from previous cell if it exists
    this.removeParticle(particle);
    
    // Add to new cell
    if (!this.grid.has(cellKey)) {
      this.grid.set(cellKey, []);
    }
    
    this.grid.get(cellKey)!.push(particle);
    this.particleToCell.set(particle, cellKey);
  }

  /**
   * Remove a particle from the spatial grid
   */
  removeParticle(particle: Particle): void {
    const previousCell = this.particleToCell.get(particle);
    
    if (previousCell && this.grid.has(previousCell)) {
      const particles = this.grid.get(previousCell)!;
      const index = particles.indexOf(particle);
      
      if (index > -1) {
        particles.splice(index, 1);
        
        // Clean up empty cells
        if (particles.length === 0) {
          this.grid.delete(previousCell);
        }
      }
    }
    
    this.particleToCell.delete(particle);
  }

  /**
   * Update all particles in the grid (rebuild)
   */
  updateParticles(particles: ReadonlyArray<Particle>): void {
    this.clear();
    
    for (const particle of particles) {
      this.addParticle(particle);
    }
  }

  /**
   * Get particles near a specific position within a radius
   */
  getParticlesNear(position: Vector2, radius: number): Particle[] {
    const nearbyParticles: Particle[] = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    
    const centerCell = this.getGridCoordinates(position);
    
    // Check surrounding cells
    for (let dy = -cellRadius; dy <= cellRadius; dy++) {
      for (let dx = -cellRadius; dx <= cellRadius; dx++) {
        const cellX = centerCell.x + dx;
        const cellY = centerCell.y + dy;
        
        if (cellX >= 0 && cellX < this.gridWidth && 
            cellY >= 0 && cellY < this.gridHeight) {
          
          const cellKey = this.getCellKeyFromCoords(cellX, cellY);
          const cellParticles = this.grid.get(cellKey);
          
          if (cellParticles) {
            // Filter particles by actual distance
            for (const particle of cellParticles) {
              const distance = this.getDistance(position, particle.position);
              if (distance <= radius) {
                nearbyParticles.push(particle);
              }
            }
          }
        }
      }
    }
    
    return nearbyParticles;
  }

  /**
   * Get particles in a specific rectangular region
   */
  getParticlesInRegion(region: Rectangle): Particle[] {
    const particles: Particle[] = [];
    
    const startCell = this.getGridCoordinates({ x: region.x, y: region.y });
    const endCell = this.getGridCoordinates({ 
      x: region.x + region.width, 
      y: region.y + region.height 
    });
    
    for (let y = startCell.y; y <= endCell.y; y++) {
      for (let x = startCell.x; x <= endCell.x; x++) {
        if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
          const cellKey = this.getCellKeyFromCoords(x, y);
          const cellParticles = this.grid.get(cellKey);
          
          if (cellParticles) {
            // Filter particles that are actually in the region
            for (const particle of cellParticles) {
              if (this.isPointInRectangle(particle.position, region)) {
                particles.push(particle);
              }
            }
          }
        }
      }
    }
    
    return particles;
  }

  /**
   * Get all non-empty cells for debugging/visualization
   */
  getActiveCells(): Array<{ key: string, particles: Particle[], bounds: Rectangle }> {
    const activeCells: Array<{ key: string, particles: Particle[], bounds: Rectangle }> = [];
    
    for (const [key, particles] of this.grid.entries()) {
      if (particles.length > 0) {
        const coords = this.parseCellKey(key);
        const bounds = {
          x: coords.x * this.cellSize,
          y: coords.y * this.cellSize,
          width: this.cellSize,
          height: this.cellSize
        };
        
        activeCells.push({ key, particles: [...particles], bounds });
      }
    }
    
    return activeCells;
  }

  /**
   * Get statistics about the spatial grid
   */
  getStats(): {
    totalCells: number;
    activeCells: number;
    totalParticles: number;
    averageParticlesPerCell: number;
    maxParticlesInCell: number;
    cellSize: number;
    gridDimensions: { width: number; height: number };
  } {
    let totalParticles = 0;
    let maxParticlesInCell = 0;
    
    for (const particles of this.grid.values()) {
      totalParticles += particles.length;
      maxParticlesInCell = Math.max(maxParticlesInCell, particles.length);
    }
    
    return {
      totalCells: this.gridWidth * this.gridHeight,
      activeCells: this.grid.size,
      totalParticles,
      averageParticlesPerCell: this.grid.size > 0 ? totalParticles / this.grid.size : 0,
      maxParticlesInCell,
      cellSize: this.cellSize,
      gridDimensions: { width: this.gridWidth, height: this.gridHeight }
    };
  }

  /**
   * Resize the spatial grid
   */
  resize(newBounds: Rectangle, newCellSize?: number): void {
    const particles = this.getAllParticles();
    
    this.bounds = newBounds;
    if (newCellSize) {
      this.cellSize = newCellSize;
    }
    
    this.gridWidth = Math.ceil(newBounds.width / this.cellSize);
    this.gridHeight = Math.ceil(newBounds.height / this.cellSize);
    
    this.clear();
    
    // Re-add all particles
    for (const particle of particles) {
      this.addParticle(particle);
    }
  }

  /**
   * Get all particles in the grid
   */
  private getAllParticles(): Particle[] {
    const allParticles: Particle[] = [];
    
    for (const particles of this.grid.values()) {
      allParticles.push(...particles);
    }
    
    return allParticles;
  }

  /**
   * Get cell key for a position
   */
  private getCellKey(position: Vector2): string {
    const coords = this.getGridCoordinates(position);
    return `${coords.x},${coords.y}`;
  }

  /**
   * Get cell key from grid coordinates
   */
  private getCellKeyFromCoords(x: number, y: number): string {
    return `${x},${y}`;
  }

  /**
   * Parse cell key back to coordinates
   */
  private parseCellKey(key: string): { x: number; y: number } {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  }

  /**
   * Get grid coordinates for a world position
   */
  private getGridCoordinates(position: Vector2): { x: number; y: number } {
    const x = Math.floor((position.x - this.bounds.x) / this.cellSize);
    const y = Math.floor((position.y - this.bounds.y) / this.cellSize);
    
    return {
      x: Math.max(0, Math.min(this.gridWidth - 1, x)),
      y: Math.max(0, Math.min(this.gridHeight - 1, y))
    };
  }

  /**
   * Calculate distance between two points
   */
  private getDistance(a: Vector2, b: Vector2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if a point is inside a rectangle
   */
  private isPointInRectangle(point: Vector2, rect: Rectangle): boolean {
    return point.x >= rect.x && 
           point.x <= rect.x + rect.width &&
           point.y >= rect.y && 
           point.y <= rect.y + rect.height;
  }
}

/**
 * Optimized spatial partitioning specifically for metaball rendering
 */
export class MetaballSpatialGrid extends SpatialPartitioning {
  private influenceRadius: number;

  constructor(bounds: Rectangle, cellSize: number = 100, influenceRadius: number = 100) {
    super(bounds, cellSize);
    this.influenceRadius = influenceRadius;
  }

  /**
   * Get particles that could influence a specific pixel
   */
  getInfluencingParticles(position: Vector2): Particle[] {
    return this.getParticlesNear(position, this.influenceRadius);
  }

  /**
   * Get particles that could influence a rectangular region
   */
  getInfluencingParticlesForRegion(region: Rectangle): Particle[] {
    // Expand region by influence radius
    const expandedRegion = {
      x: region.x - this.influenceRadius,
      y: region.y - this.influenceRadius,
      width: region.width + 2 * this.influenceRadius,
      height: region.height + 2 * this.influenceRadius
    };

    return this.getParticlesInRegion(expandedRegion);
  }

  /**
   * Update influence radius
   */
  setInfluenceRadius(radius: number): void {
    this.influenceRadius = radius;
  }

  /**
   * Get influence radius
   */
  getInfluenceRadius(): number {
    return this.influenceRadius;
  }
}