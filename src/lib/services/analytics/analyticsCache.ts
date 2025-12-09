/**
 * Multi-Layer Analytics Cache Manager
 * 
 * Implements 3-layer caching strategy:
 * L1: In-Memory Cache (Map) - Fastest, current session
 * L2: localStorage - Persists across refreshes
 * L3: Firestore Cache Collection - Shared across users
 * 
 * Cache invalidation: TTL-based (5-10 minutes) + manual invalidation
 */

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  Timestamp,
  deleteDoc,
  getDocs,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';
import { AnalyticsData, DateRange, AnalyticsFilters } from '@/types/analytics.types';

const db = getFirestore(firebaseApp);
const CACHE_COLLECTION = 'analytics_cache';

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

// L3: Firestore Cache
class FirestoreCache {
  private collection: string = CACHE_COLLECTION;

  async get<T>(key: string): Promise<T | null> {
    try {
      const docRef = doc(db, this.collection, key);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      const data = docSnap.data();
      const expiresAt = data.expiresAt?.toMillis() || 0;

      // Check expiration
      if (Date.now() > expiresAt) {
        // Auto-delete expired entry
        await deleteDoc(docRef);
        return null;
      }

      return data.data as T;
    } catch (error) {
      console.error('Error reading from Firestore cache:', error);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttl: number = CACHE_TTL_MS): Promise<void> {
    try {
      const docRef = doc(db, this.collection, key);
      await setDoc(docRef, {
        data,
        timestamp: Timestamp.now(),
        expiresAt: Timestamp.fromMillis(Date.now() + ttl),
        key,
        lastAccessed: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error('Error writing to Firestore cache:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const docRef = doc(db, this.collection, key);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting from Firestore cache:', error);
    }
  }
}

// Main Cache Manager
class AnalyticsCacheManager {
  private l1Cache: InMemoryCache;
  private l2Cache: LocalStorageCache;
  private l3Cache: FirestoreCache;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    l1Hits: 0,
    l2Hits: 0,
    l3Hits: 0,
  };

  constructor() {
    this.l1Cache = new InMemoryCache();
    this.l2Cache = new LocalStorageCache();
    this.l3Cache = new FirestoreCache();
  }

  /**
   * Generate cache key from dateRange and filters
   */
  private generateCacheKey(
    dateRange: DateRange,
    filters?: AnalyticsFilters,
    tab?: string
  ): string {
    const dateKey = `${dateRange.start.getTime()}-${dateRange.end.getTime()}-${dateRange.preset || 'custom'}`;
    const filterKey = filters 
      ? JSON.stringify({
          status: filters.status?.sort(),
          researchType: filters.researchType?.sort(),
          reviewerId: filters.reviewerId?.sort(),
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

    // L3: Firestore Cache
    const l3Data = await this.l3Cache.get<T>(key);
    if (l3Data) {
      this.stats.hits++;
      this.stats.l3Hits++;
      // Promote to L1 and L2
      this.l1Cache.set(key, l3Data, ttl);
      this.l2Cache.set(key, l3Data, ttl);
      return l3Data;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set data in all cache layers
   */
  async set<T>(
    dateRange: DateRange,
    data: T,
    filters?: AnalyticsFilters,
    tab?: string,
    ttl: number = CACHE_TTL_MS
  ): Promise<void> {
    const key = this.generateCacheKey(dateRange, filters, tab);

    // Set in all layers
    this.l1Cache.set(key, data, ttl);
    this.l2Cache.set(key, data, ttl);
    
    // Firestore cache is async, don't await (fire and forget for performance)
    this.l3Cache.set(key, data, ttl).catch(error => {
      console.error('Failed to write to Firestore cache:', error);
    });
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
      await this.l3Cache.delete(key);
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
  // Clear all cache layers
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

/**
 * Clean up all expired documents from Firestore cache
 * Queries all documents where expiresAt < now and deletes them in batches
 * @returns Object with deleted count and any errors
 */
export async function cleanupExpiredCacheDocuments(): Promise<{
  deleted: number;
  errors: number;
  totalChecked: number;
}> {
  try {
    const now = Timestamp.now();
    const cacheCollection = collection(db, CACHE_COLLECTION);
    
    // Query all documents where expiresAt < now
    const expiredQuery = query(
      cacheCollection,
      where('expiresAt', '<', now)
    );
    
    const snapshot = await getDocs(expiredQuery);
    const expiredDocs = snapshot.docs;
    const totalChecked = expiredDocs.length;
    
    if (expiredDocs.length === 0) {
      console.log('No expired cache documents found.');
      return { deleted: 0, errors: 0, totalChecked: 0 };
    }
    
    console.log(`Found ${expiredDocs.length} expired cache documents. Deleting...`);
    
    // Firestore batch limit is 500 operations
    const BATCH_SIZE = 500;
    let deleted = 0;
    let errors = 0;
    
    // Process in batches
    for (let i = 0; i < expiredDocs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchDocs = expiredDocs.slice(i, i + BATCH_SIZE);
      
      batchDocs.forEach((docSnapshot) => {
        try {
          batch.delete(docSnapshot.ref);
        } catch (error) {
          console.error(`Error adding document ${docSnapshot.id} to batch:`, error);
          errors++;
        }
      });
      
      try {
        await batch.commit();
        deleted += batchDocs.length;
        console.log(`Deleted batch: ${batchDocs.length} documents (${deleted}/${expiredDocs.length})`);
      } catch (error) {
        console.error(`Error committing batch ${i / BATCH_SIZE + 1}:`, error);
        errors += batchDocs.length;
      }
    }
    
    console.log(`Cleanup complete: ${deleted} deleted, ${errors} errors, ${totalChecked} total checked`);
    return { deleted, errors, totalChecked };
  } catch (error: any) {
    console.error('Error cleaning up expired cache documents:', error);
    
    // Check if it's an index error
    if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
      console.error(
        '⚠️ Firestore index required. Please create an index on the analytics_cache collection ' +
        'for the field "expiresAt". Firestore will provide a link to create the index in the error message.'
      );
    }
    
    return { deleted: 0, errors: 1, totalChecked: 0 };
  }
}

// Export for testing
export { AnalyticsCacheManager, InMemoryCache, LocalStorageCache, FirestoreCache };

