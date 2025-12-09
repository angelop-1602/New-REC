/**
 * Admin Utilities
 * Utility functions for administrative tasks like cache cleanup
 */

import { cleanupExpiredCacheDocuments } from '@/lib/services/analytics/analyticsCache';

/**
 * Clean up expired analytics cache documents
 * Call this function to remove all expired documents from the analytics_cache collection
 * 
 * Usage:
 * - From browser console: window.cleanupAnalyticsCache()
 * - Or import and call: cleanupAnalyticsCache()
 * 
 * @returns Promise with cleanup results
 */
export async function cleanupAnalyticsCache(): Promise<{
  deleted: number;
  errors: number;
  totalChecked: number;
}> {
  console.log('🧹 Starting analytics cache cleanup...');
  const result = await cleanupExpiredCacheDocuments();
  
  if (result.deleted > 0) {
    console.log(`✅ Successfully deleted ${result.deleted} expired cache documents`);
  } else {
    console.log('ℹ️ No expired documents found to delete');
  }
  
  if (result.errors > 0) {
    console.warn(`⚠️ Encountered ${result.errors} errors during cleanup`);
  }
  
  return result;
}

// Make it available globally for easy access from browser console
if (typeof window !== 'undefined') {
  (window as any).cleanupAnalyticsCache = cleanupAnalyticsCache;
}

