/**
 * Intelligent caching layer with TTL support
 * Reduces RPC calls and improves performance
 */

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface CacheConfig {
  defaultTTL: number; // milliseconds
  maxSize: number;
}

export class Cache<K, V> {
  private store: Map<K, CacheEntry<V>> = new Map();
  private config: CacheConfig;
  private accessOrder: K[] = []; // For LRU eviction

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: config.defaultTTL ?? 60000, // 1 minute default
      maxSize: config.maxSize ?? 1000,
    };
  }

  set(key: K, value: V, ttl?: number): void {
    const actualTTL = ttl ?? this.config.defaultTTL;
    const expiresAt = Date.now() + actualTTL;

    // Evict if at capacity
    if (this.store.size >= this.config.maxSize && !this.store.has(key)) {
      this.evictLRU();
    }

    this.store.set(key, { value, expiresAt });
    this.updateAccessOrder(key);
  }

  get(key: K): V | undefined {
    const entry = this.store.get(key);

    if (!entry) {
      return undefined;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.removeFromAccessOrder(key);
      return undefined;
    }

    this.updateAccessOrder(key);
    return entry.value;
  }

  has(key: K): boolean {
    const entry = this.store.get(key);

    if (!entry) {
      return false;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.removeFromAccessOrder(key);
      return false;
    }

    return true;
  }

  delete(key: K): boolean {
    this.removeFromAccessOrder(key);
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
    this.accessOrder = [];
  }

  size(): number {
    // Clean expired entries first
    this.cleanExpired();
    return this.store.size;
  }

  private cleanExpired(): void {
    const now = Date.now();
    const toDelete: K[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.store.delete(key);
      this.removeFromAccessOrder(key);
    }
  }

  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder[0];
      this.store.delete(lruKey);
      this.accessOrder.shift();
    }
  }

  private updateAccessOrder(key: K): void {
    // Remove if exists
    this.removeFromAccessOrder(key);
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: K): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  // Get cache statistics
  stats(): {
    size: number;
    capacity: number;
    utilizationPercent: number;
  } {
    this.cleanExpired();
    const size = this.store.size;
    const capacity = this.config.maxSize;

    return {
      size,
      capacity,
      utilizationPercent: (size / capacity) * 100,
    };
  }
}
