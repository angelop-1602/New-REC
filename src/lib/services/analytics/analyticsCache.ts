/**
 * Multi-Layer Analytics Cache Manager
 * 
 * Implements 2-layer caching strategy:
 * L1: In-Memory Cache (Map) - Fastest, current session
 * L2: localStorage - Persists across refreshes, per-user
 * 
 * Note: Firestore cache removed - analytics can be recomputed from source data
 * Cache invalidation: TTL-based (5-10 minutes) + manual invalidation
 */

import { AnalyticsData, DateRange, AnalyticsFilters } from '@/types/analytics.types';

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes default TTL
const CACHE_TTL_LONG_MS = 10 * 60 * 1000; // 10 minutes for system health
const LOCALSTORAGE_PREFIX = 'analytics_cache_';
const MAX_LOCALSTORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  l1Hits: number;
  l2Hits: number;
  l3Hits: number;
}

// L1: In-Memory Cache (Map)
class InMemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number = 50; // Max 50 entries

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number = CACHE_TTL_MS): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      key,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// L2: localStorage Cache
class LocalStorageCache {
  private prefix: string = LOCALSTORAGE_PREFIX;

  private getKey(cacheKey: string): string {
    return `${this.prefix}${cacheKey}`;
  }

  private isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private getStorageSize(): number {
    if (!this.isAvailable()) return 0;
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        total += localStorage.getItem(key)?.length || 0;
      }
    }
    return total;
  }

  get<T>(key: string): T | null {
    if (!this.isAvailable()) return null;

    try {
      const storageKey = this.getKey(key);
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const entry: CacheEntry<T> = JSON.parse(stored);

      // Check expiration
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Error reading from localStorage cache:', error);
      return null;
    }
  }

  set<T>(key: string, data: T, ttl: number = CACHE_TTL_MS): void {
    if (!this.isAvailable()) return;

    try {
      const storageKey = this.getKey(key);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
        key,
      };

      const serialized = JSON.stringify(entry);
      const currentSize = this.getStorageSize();

      // Check if adding this would exceed limit
      if (currentSize + serialized.length > MAX_LOCALSTORAGE_SIZE) {
        // Evict oldest entries
        this.evictOldest();
      }

      localStorage.setItem(storageKey, serialized);
    } catch (error) {
      console.error('Error writing to localStorage cache:', error);
      // If quota exceeded, evict oldest and try again
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.evictOldest();
        try {
          localStorage.setItem(this.getKey(key), JSON.stringify({
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + ttl,
            key,
          }));
        } catch (retryError) {
          console.error('Failed to write to localStorage after eviction:', retryError);
        }
      }
    }
  }

  private evictOldest(): void {
    if (!this.isAvailable()) return;

    const entries: Array<{ key: string; timestamp: number }> = [];

    // Collect all cache entries
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith(this.prefix)) {
        try {
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const entry: CacheEntry<any> = JSON.parse(stored);
            entries.push({ key: storageKey, timestamp: entry.timestamp });
          }
        } catch {
          // Skip corrupted entries
        }
      }
    }

    // Sort by timestamp (oldest first) and remove oldest 25%
    entries.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(entries[i].key);
    }
  }

  delete(key: string): void {
    if (!this.isAvailable()) return;
    localStorage.removeItem(this.getKey(key));
  }

  clear(): void {
    if (!this.isAvailable()) return;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key);
      }
    }
    keys.forEach(key => localStorage.removeItem(key));
  }
}

// Firestore cache removed - analytics can be recomputed from source data
// Using only L1 (in-memory) and L2 (localStorage) caching

// Main Cache Manager
class AnalyticsCacheManager {
  private l1Cache: InMemoryCache;
  private l2Cache: LocalStorageCache;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    l1Hits: 0,
    l2Hits: 0,
    l3Hits: 0, // Kept for backwards compatibility but not used
  };

  constructor() {
    this.l1Cache = new InMemoryCache();
    this.l2Cache = new LocalStorageCache();
  }

  /**
   * Generate cache key from dateRange and filters
   * Normalizes dates to start of day to prevent duplicates from time differences
   */
  private generateCacheKey(
    dateRange: DateRange,
    filters?: AnalyticsFilters,
    tab?: string
  ): string {
    // Normalize dates to start of day to prevent duplicates from millisecond differences
    const normalizeDate = (date: Date): number => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized.getTime();
    };
    
    const startTime = normalizeDate(dateRange.start);
    const endTime = normalizeDate(dateRange.end);
    const preset = dateRange.preset || 'custom';
    const dateKey = `${startTime}-${endTime}-${preset}`;
    
    // Normalize filters - sort arrays to ensure consistent keys
    const filterKey = filters 
      ? JSON.stringify({
          status: filters.status?.sort() || [],
          researchType: filters.researchType?.sort() || [],
          reviewerId: filters.reviewerId?.sort() || [],
        })
      : 'no-filters';
    
    const tabKey = tab ? `-${tab}` : '';
    return `analytics_${dateKey}_${filterKey}${tabKey}`;
  }

  /**
   * Get data from cache (checks all layers)
   */
  async get<T>(
    dateRange: DateRange,
    filters?: AnalyticsFilters,
    tab?: string,
    ttl: number = CACHE_TTL_MS
  ): Promise<T | null> {
    const key = this.generateCacheKey(dateRange, filters, tab);

    // L1: In-Memory Cache
    const l1Data = this.l1Cache.get<T>(key);
    if (l1Data) {
      this.stats.hits++;
      this.stats.l1Hits++;
      return l1Data;
    }

    // L2: localStorage Cache
    const l2Data = this.l2Cache.get<T>(key);
    if (l2Data) {
      this.stats.hits++;
      this.stats.l2Hits++;
      // Promote to L1
      this.l1Cache.set(key, l2Data, ttl);
      return l2Data;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set data in cache layers (L1 and L2 only)
   */
  async set<T>(
    dateRange: DateRange,
    data: T,
    filters?: AnalyticsFilters,
    tab?: string,
    ttl: number = CACHE_TTL_MS
  ): Promise<void> {
    const key = this.generateCacheKey(dateRange, filters, tab);

    // Set in L1 and L2 layers only
    this.l1Cache.set(key, data, ttl);
    this.l2Cache.set(key, data, ttl);
  }

  /**
   * Invalidate cache for specific dateRange/filters
   */
  async invalidate(
    dateRange?: DateRange,
    filters?: AnalyticsFilters,
    tab?: string
  ): Promise<void> {
    if (dateRange) {
      const key = this.generateCacheKey(dateRange, filters, tab);
      this.l1Cache.delete(key);
      this.l2Cache.delete(key);
    } else {
      // Clear all if no specific key
      this.l1Cache.clear();
      this.l2Cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number; totalRequests: number } {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 
      ? (this.stats.hits / totalRequests) * 100 
      : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      totalRequests,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
    };
  }
}

// Singleton instance
let cacheManagerInstance: AnalyticsCacheManager | null = null;

export function getAnalyticsCache(): AnalyticsCacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new AnalyticsCacheManager();
  }
  return cacheManagerInstance;
}

/**
 * Invalidate analytics cache when protocol data changes
 * Call this after any protocol status updates, approvals, rejections, etc.
 */
export async function invalidateAnalyticsCache(): Promise<void> {
  const cache = getAnalyticsCache();
  // Clear all cache layers (L1 and L2)
  await cache.invalidate();
}

/**
 * Invalidate cache for specific date range (when filters change)
 */
export async function invalidateAnalyticsCacheForRange(
  dateRange: DateRange,
  filters?: AnalyticsFilters
): Promise<void> {
  const cache = getAnalyticsCache();
  await cache.invalidate(dateRange, filters);
}

// Firestore cleanup functions removed - no longer using Firestore cache

// Export for testing
export { AnalyticsCacheManager, InMemoryCache, LocalStorageCache };

