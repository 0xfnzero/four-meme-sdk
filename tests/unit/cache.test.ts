import { Cache } from '../../src/cache';

describe('Cache', () => {
  let cache: Cache<string, number>;

  beforeEach(() => {
    cache = new Cache({ defaultTTL: 1000, maxSize: 5 });
  });

  describe('basic operations', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 100);
      expect(cache.get('key1')).toBe(100);
    });

    it('should return undefined for non-existent key', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should check if key exists', () => {
      cache.set('key1', 100);
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });

    it('should delete entries', () => {
      cache.set('key1', 100);
      expect(cache.has('key1')).toBe(true);

      cache.delete('key1');
      expect(cache.has('key1')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 100);
      cache.set('key2', 200);
      cache.set('key3', 300);

      expect(cache.size()).toBe(3);

      cache.clear();
      expect(cache.size()).toBe(0);
    });

    it('should track cache size', () => {
      expect(cache.size()).toBe(0);

      cache.set('key1', 100);
      expect(cache.size()).toBe(1);

      cache.set('key2', 200);
      expect(cache.size()).toBe(2);

      cache.delete('key1');
      expect(cache.size()).toBe(1);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after default TTL', async () => {
      const shortCache = new Cache<string, number>({ defaultTTL: 100 });

      shortCache.set('key1', 100);
      expect(shortCache.get('key1')).toBe(100);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(shortCache.get('key1')).toBeUndefined();
      expect(shortCache.has('key1')).toBe(false);
    });

    it('should support custom TTL per entry', async () => {
      cache.set('key1', 100, 100); // 100ms TTL
      cache.set('key2', 200, 500); // 500ms TTL

      expect(cache.get('key1')).toBe(100);
      expect(cache.get('key2')).toBe(200);

      // Wait for key1 to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe(200); // Still valid

      // Wait for key2 to expire
      await new Promise(resolve => setTimeout(resolve, 400));

      expect(cache.get('key2')).toBeUndefined();
    });

    it('should update entry timestamp on re-set', async () => {
      const shortCache = new Cache<string, number>({ defaultTTL: 200 });

      shortCache.set('key1', 100);

      // Wait 100ms
      await new Promise(resolve => setTimeout(resolve, 100));

      // Re-set the value (resets TTL)
      shortCache.set('key1', 150);

      // Wait another 150ms (total 250ms from first set, but only 150ms from re-set)
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should still be valid (200ms TTL from re-set)
      expect(shortCache.get('key1')).toBe(150);
    });
  });

  describe('LRU (Least Recently Used)', () => {
    it('should evict least recently used entry when at capacity', () => {
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);
      cache.set('key4', 4);
      cache.set('key5', 5);

      expect(cache.size()).toBe(5);

      // Add 6th entry, should evict key1 (least recently used)
      cache.set('key6', 6);

      expect(cache.size()).toBe(5);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key6')).toBe(true);
    });

    it('should update access order on get', () => {
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);
      cache.set('key4', 4);
      cache.set('key5', 5);

      // Access key1, making it most recently used
      cache.get('key1');

      // Add new entry, should evict key2 (now least recently used)
      cache.set('key6', 6);

      expect(cache.has('key1')).toBe(true); // Still exists
      expect(cache.has('key2')).toBe(false); // Evicted
    });

    it('should not evict if entry exists', () => {
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);

      // Re-set existing key
      cache.set('key2', 200);

      expect(cache.size()).toBe(3);
      expect(cache.get('key2')).toBe(200);
    });
  });

  describe('stats', () => {
    it('should provide cache statistics', () => {
      cache.set('key1', 1);
      cache.set('key2', 2);

      const stats = cache.stats();

      expect(stats.size).toBe(2);
      expect(stats.capacity).toBe(5);
      expect(stats.utilizationPercent).toBe(40);
    });

    it('should update stats after operations', () => {
      expect(cache.stats().size).toBe(0);
      expect(cache.stats().utilizationPercent).toBe(0);

      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);

      expect(cache.stats().size).toBe(3);
      expect(cache.stats().utilizationPercent).toBe(60);

      cache.delete('key1');

      expect(cache.stats().size).toBe(2);
      expect(cache.stats().utilizationPercent).toBe(40);
    });

    it('should exclude expired entries from stats', async () => {
      const shortCache = new Cache<string, number>({ defaultTTL: 100, maxSize: 10 });

      shortCache.set('key1', 1);
      shortCache.set('key2', 2);
      shortCache.set('key3', 3);

      expect(shortCache.stats().size).toBe(3);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(shortCache.stats().size).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid successive sets', () => {
      for (let i = 0; i < 1000; i++) {
        cache.set(`key${i}`, i);
      }

      // Should only keep last 5 (maxSize)
      expect(cache.size()).toBe(5);
    });

    it('should handle complex object keys', () => {
      type ComplexKey = { id: number; type: string };
      const complexCache = new Cache<ComplexKey, string>();

      const key1: ComplexKey = { id: 1, type: 'test' };
      const key2: ComplexKey = { id: 1, type: 'test' };

      complexCache.set(key1, 'value1');

      // Same structure but different object reference
      expect(complexCache.get(key2)).toBeUndefined();

      // Same object reference
      expect(complexCache.get(key1)).toBe('value1');
    });

    it('should handle null and undefined values', () => {
      cache.set('null', null as any);
      cache.set('undefined', undefined as any);

      expect(cache.get('null')).toBeNull();
      expect(cache.get('undefined')).toBeUndefined();

      // Distinguish between "key not found" and "value is undefined"
      expect(cache.has('undefined')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });
  });
});
