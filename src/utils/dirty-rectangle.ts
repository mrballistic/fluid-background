/**
 * Dirty rectangle tracking system for optimized rendering
 * Tracks which areas of the canvas need to be redrawn
 */

import { Rectangle, Vector2, Particle } from '../types/splash-cursor';

export interface DirtyRegion extends Rectangle {
  lastUpdate: number;
  priority: number;
}

export class DirtyRectangleTracker {
  private dirtyRegions: Set<DirtyRegion> = new Set();
  private canvasBounds: Rectangle;
  private minRegionSize: number;
  private maxRegions: number;
  private mergeThreshold: number;

  constructor(
    canvasBounds: Rectangle,
    options: {
      minRegionSize?: number;
      maxRegions?: number;
      mergeThreshold?: number;
    } = {}
  ) {
    this.canvasBounds = canvasBounds;
    this.minRegionSize = options.minRegionSize || 32;
    this.maxRegions = options.maxRegions || 50;
    this.mergeThreshold = options.mergeThreshold || 1.5;
  }

  /**
   * Mark a rectangular area as dirty
   */
  markDirty(region: Rectangle, priority: number = 1): void {
    const clampedRegion = this.clampToCanvas(region);
    
    if (clampedRegion.width < this.minRegionSize || clampedRegion.height < this.minRegionSize) {
      // Expand small regions to minimum size
      const expandedRegion = this.expandToMinimumSize(clampedRegion);
      this.addDirtyRegion(expandedRegion, priority);
    } else {
      this.addDirtyRegion(clampedRegion, priority);
    }
  }

  /**
   * Mark area around a particle as dirty
   */
  markParticleDirty(particle: Particle, influenceRadius: number = 50): void {
    const region = {
      x: particle.position.x - influenceRadius,
      y: particle.position.y - influenceRadius,
      width: influenceRadius * 2,
      height: influenceRadius * 2
    };

    this.markDirty(region, this.calculateParticlePriority(particle));
  }

  /**
   * Mark areas around multiple particles as dirty
   */
  markParticlesDirty(particles: ReadonlyArray<Particle>, influenceRadius: number = 50): void {
    for (const particle of particles) {
      this.markParticleDirty(particle, influenceRadius);
    }

    // Optimize by merging overlapping regions
    this.optimizeRegions();
  }

  /**
   * Mark area around a moving particle as dirty (includes trail)
   */
  markMovingParticleDirty(
    particle: Particle, 
    previousPosition: Vector2, 
    influenceRadius: number = 50
  ): void {
    // Mark current position
    this.markParticleDirty(particle, influenceRadius);

    // Mark previous position to clear trail
    const previousRegion = {
      x: previousPosition.x - influenceRadius,
      y: previousPosition.y - influenceRadius,
      width: influenceRadius * 2,
      height: influenceRadius * 2
    };

    this.markDirty(previousRegion, this.calculateParticlePriority(particle));

    // Mark the path between positions for smooth trails
    this.markPathDirty(previousPosition, particle.position, influenceRadius);
  }

  /**
   * Mark the entire canvas as dirty
   */
  markAllDirty(): void {
    this.dirtyRegions.clear();
    this.addDirtyRegion(this.canvasBounds, 10); // High priority
  }

  /**
   * Get all dirty regions sorted by priority
   */
  getDirtyRegions(): DirtyRegion[] {
    return Array.from(this.dirtyRegions).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get optimized dirty regions (merged overlapping regions)
   */
  getOptimizedDirtyRegions(): DirtyRegion[] {
    this.optimizeRegions();
    return this.getDirtyRegions();
  }

  /**
   * Check if a region intersects with any dirty regions
   */
  isRegionDirty(region: Rectangle): boolean {
    for (const dirtyRegion of this.dirtyRegions) {
      if (this.rectanglesIntersect(region, dirtyRegion)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get the bounding rectangle of all dirty regions
   */
  getDirtyBounds(): Rectangle | null {
    if (this.dirtyRegions.size === 0) {
      return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const region of this.dirtyRegions) {
      minX = Math.min(minX, region.x);
      minY = Math.min(minY, region.y);
      maxX = Math.max(maxX, region.x + region.width);
      maxY = Math.max(maxY, region.y + region.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Clear all dirty regions
   */
  clearDirty(): void {
    this.dirtyRegions.clear();
  }

  /**
   * Clear dirty regions older than specified time
   */
  clearOldRegions(maxAge: number): void {
    const now = performance.now();
    const regionsToRemove: DirtyRegion[] = [];

    for (const region of this.dirtyRegions) {
      if (now - region.lastUpdate > maxAge) {
        regionsToRemove.push(region);
      }
    }

    for (const region of regionsToRemove) {
      this.dirtyRegions.delete(region);
    }
  }

  /**
   * Update canvas bounds
   */
  updateCanvasBounds(newBounds: Rectangle): void {
    this.canvasBounds = newBounds;
    
    // Remove regions that are now outside canvas bounds
    const regionsToRemove: DirtyRegion[] = [];
    
    for (const region of this.dirtyRegions) {
      if (!this.rectanglesIntersect(region, newBounds)) {
        regionsToRemove.push(region);
      }
    }

    for (const region of regionsToRemove) {
      this.dirtyRegions.delete(region);
    }
  }

  /**
   * Get statistics about dirty regions
   */
  getStats(): {
    regionCount: number;
    totalDirtyArea: number;
    canvasArea: number;
    dirtyPercentage: number;
    averageRegionSize: number;
  } {
    let totalArea = 0;
    
    for (const region of this.dirtyRegions) {
      totalArea += region.width * region.height;
    }

    const canvasArea = this.canvasBounds.width * this.canvasBounds.height;
    const averageRegionSize = this.dirtyRegions.size > 0 ? totalArea / this.dirtyRegions.size : 0;

    return {
      regionCount: this.dirtyRegions.size,
      totalDirtyArea: totalArea,
      canvasArea,
      dirtyPercentage: canvasArea > 0 ? (totalArea / canvasArea) * 100 : 0,
      averageRegionSize
    };
  }

  /**
   * Add a dirty region with optimization
   */
  private addDirtyRegion(region: Rectangle, priority: number): void {
    const dirtyRegion: DirtyRegion = {
      ...region,
      lastUpdate: performance.now(),
      priority
    };

    // Check for overlapping regions and merge if beneficial
    const overlapping = this.findOverlappingRegions(region);
    
    if (overlapping.length > 0) {
      // Remove overlapping regions
      for (const overlappingRegion of overlapping) {
        this.dirtyRegions.delete(overlappingRegion);
      }

      // Create merged region
      const mergedRegion = this.mergeRegions([dirtyRegion, ...overlapping]);
      this.dirtyRegions.add(mergedRegion);
    } else {
      this.dirtyRegions.add(dirtyRegion);
    }

    // Limit number of regions to prevent memory issues
    this.limitRegionCount();
  }

  /**
   * Find regions that overlap with the given region
   */
  private findOverlappingRegions(region: Rectangle): DirtyRegion[] {
    const overlapping: DirtyRegion[] = [];

    for (const dirtyRegion of this.dirtyRegions) {
      if (this.rectanglesIntersect(region, dirtyRegion)) {
        overlapping.push(dirtyRegion);
      }
    }

    return overlapping;
  }

  /**
   * Merge multiple regions into one
   */
  private mergeRegions(regions: DirtyRegion[]): DirtyRegion {
    if (regions.length === 0) {
      throw new Error('Cannot merge empty regions array');
    }

    if (regions.length === 1) {
      return regions[0];
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxPriority = 0;
    let latestUpdate = 0;

    for (const region of regions) {
      minX = Math.min(minX, region.x);
      minY = Math.min(minY, region.y);
      maxX = Math.max(maxX, region.x + region.width);
      maxY = Math.max(maxY, region.y + region.height);
      maxPriority = Math.max(maxPriority, region.priority);
      latestUpdate = Math.max(latestUpdate, region.lastUpdate);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      lastUpdate: latestUpdate,
      priority: maxPriority
    };
  }

  /**
   * Optimize regions by merging nearby ones
   */
  private optimizeRegions(): void {
    if (this.dirtyRegions.size <= 1) {
      return;
    }

    const regions = Array.from(this.dirtyRegions);
    const merged: DirtyRegion[] = [];
    const processed = new Set<DirtyRegion>();

    for (const region of regions) {
      if (processed.has(region)) {
        continue;
      }

      const nearby = this.findNearbyRegions(region, regions);
      const toMerge = [region, ...nearby.filter(r => !processed.has(r))];

      if (toMerge.length > 1 && this.shouldMergeRegions(toMerge)) {
        const mergedRegion = this.mergeRegions(toMerge);
        merged.push(mergedRegion);
        
        for (const r of toMerge) {
          processed.add(r);
        }
      } else {
        merged.push(region);
        processed.add(region);
      }
    }

    // Replace regions with optimized set
    this.dirtyRegions.clear();
    for (const region of merged) {
      this.dirtyRegions.add(region);
    }
  }

  /**
   * Find regions that are nearby (within merge threshold)
   */
  private findNearbyRegions(target: Rectangle, regions: DirtyRegion[]): DirtyRegion[] {
    const nearby: DirtyRegion[] = [];

    for (const region of regions) {
      if (region === target) {
        continue;
      }

      const distance = this.calculateRegionDistance(target, region);
      const avgSize = (this.getRegionSize(target) + this.getRegionSize(region)) / 2;

      if (distance < avgSize * this.mergeThreshold) {
        nearby.push(region);
      }
    }

    return nearby;
  }

  /**
   * Check if regions should be merged based on efficiency
   */
  private shouldMergeRegions(regions: DirtyRegion[]): boolean {
    if (regions.length <= 1) {
      return false;
    }

    const totalArea = regions.reduce((sum, r) => sum + r.width * r.height, 0);
    const mergedRegion = this.mergeRegions([...regions]);
    const mergedArea = mergedRegion.width * mergedRegion.height;

    // Merge if the merged area is not significantly larger than the sum
    return mergedArea <= totalArea * this.mergeThreshold;
  }

  /**
   * Calculate distance between two regions
   */
  private calculateRegionDistance(a: Rectangle, b: Rectangle): number {
    const centerA = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
    const centerB = { x: b.x + b.width / 2, y: b.y + b.height / 2 };

    const dx = centerA.x - centerB.x;
    const dy = centerA.y - centerB.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get the size (diagonal) of a region
   */
  private getRegionSize(region: Rectangle): number {
    return Math.sqrt(region.width * region.width + region.height * region.height);
  }

  /**
   * Limit the number of regions to prevent memory issues
   */
  private limitRegionCount(): void {
    if (this.dirtyRegions.size <= this.maxRegions) {
      return;
    }

    // Convert to array and sort by priority (descending)
    const regions = Array.from(this.dirtyRegions).sort((a, b) => b.priority - a.priority);

    // Keep only the highest priority regions
    this.dirtyRegions.clear();
    for (let i = 0; i < this.maxRegions; i++) {
      this.dirtyRegions.add(regions[i]);
    }
  }

  /**
   * Mark path between two points as dirty
   */
  private markPathDirty(start: Vector2, end: Vector2, radius: number): void {
    const distance = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
    const steps = Math.ceil(distance / radius);

    for (let i = 0; i <= steps; i++) {
      const t = steps > 0 ? i / steps : 0;
      const x = start.x + (end.x - start.x) * t;
      const y = start.y + (end.y - start.y) * t;

      const region = {
        x: x - radius,
        y: y - radius,
        width: radius * 2,
        height: radius * 2
      };

      this.markDirty(region, 1);
    }
  }

  /**
   * Calculate priority for a particle based on its properties
   */
  private calculateParticlePriority(particle: Particle): number {
    // Higher priority for:
    // - Particles with more life remaining
    // - Larger particles
    // - Particles with higher alpha
    const lifeFactor = particle.life / particle.maxLife;
    const sizeFactor = particle.size / 20; // Normalize assuming max size ~20
    const alphaFactor = particle.color.a;

    return (lifeFactor + sizeFactor + alphaFactor) / 3;
  }

  /**
   * Clamp region to canvas bounds
   */
  private clampToCanvas(region: Rectangle): Rectangle {
    const x = Math.max(0, Math.min(this.canvasBounds.width, region.x));
    const y = Math.max(0, Math.min(this.canvasBounds.height, region.y));
    const maxX = Math.max(x, Math.min(this.canvasBounds.width, region.x + region.width));
    const maxY = Math.max(y, Math.min(this.canvasBounds.height, region.y + region.height));

    return {
      x,
      y,
      width: maxX - x,
      height: maxY - y
    };
  }

  /**
   * Expand region to minimum size
   */
  private expandToMinimumSize(region: Rectangle): Rectangle {
    const centerX = region.x + region.width / 2;
    const centerY = region.y + region.height / 2;

    return {
      x: centerX - this.minRegionSize / 2,
      y: centerY - this.minRegionSize / 2,
      width: this.minRegionSize,
      height: this.minRegionSize
    };
  }

  /**
   * Check if two rectangles intersect
   */
  private rectanglesIntersect(a: Rectangle, b: Rectangle): boolean {
    return !(a.x + a.width < b.x || 
             b.x + b.width < a.x || 
             a.y + a.height < b.y || 
             b.y + b.height < a.y);
  }
}