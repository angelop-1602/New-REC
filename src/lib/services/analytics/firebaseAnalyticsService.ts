/**
 * Firebase Analytics Service
 * Integrates Firebase Analytics data into system health metrics
 */

import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';
import firebaseApp from '@/lib/firebaseConfig';
import { collection, doc, setDoc, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

const db = getFirestore(firebaseApp);

// Initialize Analytics (only on client side)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(firebaseApp);
  } catch (error) {
    console.warn('Firebase Analytics initialization failed:', error);
  }
}

/**
 * Track custom analytics events
 */
export function trackAnalyticsEvent(
  eventName: string,
  eventParams?: Record<string, any>
): void {
  if (analytics && typeof window !== 'undefined') {
    try {
      logEvent(analytics, eventName, eventParams);
    } catch (error) {
      console.warn('Failed to log analytics event:', error);
    }
  }
}

/**
 * Track page view
 */
export function trackPageView(pageName: string, pagePath: string): void {
  trackAnalyticsEvent('page_view', {
    page_title: pageName,
    page_location: pagePath,
  });
}

/**
 * Track analytics dashboard view
 */
export function trackAnalyticsDashboardView(tab: string): void {
  trackAnalyticsEvent('analytics_dashboard_view', {
    tab_name: tab,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track error event
 */
export function trackError(errorType: string, errorMessage: string, errorStack?: string): void {
  trackAnalyticsEvent('error_occurred', {
    error_type: errorType,
    error_message: errorMessage,
    error_stack: errorStack,
    timestamp: new Date().toISOString(),
  });
  
  // Also store in Firestore for system health tracking
  if (typeof window !== 'undefined') {
    storeErrorInFirestore(errorType, errorMessage, errorStack);
  }
}

/**
 * Store error in Firestore for analytics
 */
async function storeErrorInFirestore(
  errorType: string,
  errorMessage: string,
  errorStack?: string
): Promise<void> {
  try {
    const errorsRef = collection(db, 'analytics_errors');
    await setDoc(doc(errorsRef), {
      errorType,
      errorMessage: errorMessage.substring(0, 500), // Limit length
      errorStack: errorStack?.substring(0, 1000),
      timestamp: Timestamp.now(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
    });
  } catch (error) {
    console.error('Failed to store error in Firestore:', error);
  }
}

/**
 * Track performance metric
 */
export function trackPerformance(metricName: string, value: number, unit: string = 'ms'): void {
  trackAnalyticsEvent('performance_metric', {
    metric_name: metricName,
    value,
    unit,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get error trends from Firestore
 */
export async function getErrorTrends(dateRange: { start: Date; end: Date }) {
  try {
    const errorsRef = collection(db, 'analytics_errors');
    // Query all errors and filter by date in memory to avoid index requirement
    const q = query(errorsRef);
    
    const snapshot = await getDocs(q);
    const allErrors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Filter by date range in memory
    const startTime = dateRange.start.getTime();
    const endTime = dateRange.end.getTime();
    const errors = allErrors.filter((error: any) => {
      const errorTime = error.timestamp?.toDate?.() || new Date(error.timestamp || 0);
      const errorTimeMs = errorTime.getTime();
      return errorTimeMs >= startTime && errorTimeMs <= endTime;
    });
    
    // Sort in memory by timestamp (descending)
    errors.sort((a: any, b: any) => {
      const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
      const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
      return bTime.getTime() - aTime.getTime();
    });
    
    // Group by date
    const trendsMap = new Map<string, { errors: number; usersAffected: Set<string> }>();
    
    errors.forEach((error: any) => {
      const date = error.timestamp?.toDate?.() || new Date(error.timestamp);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!trendsMap.has(dateKey)) {
        trendsMap.set(dateKey, { errors: 0, usersAffected: new Set() });
      }
      
      const trend = trendsMap.get(dateKey)!;
      trend.errors++;
      // Use userAgent as a proxy for unique users (in real app, use user ID)
      if (error.userAgent) {
        trend.usersAffected.add(error.userAgent);
      }
    });
    
    // Convert to array format
    const trends = Array.from(trendsMap.entries()).map(([date, data]) => ({
      date,
      errors: data.errors,
      usersAffected: data.usersAffected.size,
    }));
    
    return trends.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error fetching error trends:', error);
    return [];
  }
}

/**
 * Get analytics dashboard usage stats
 */
export async function getAnalyticsUsageStats(dateRange: { start: Date; end: Date }) {
  try {
    // This would typically come from Firebase Analytics Reporting API
    // For now, we'll use a simplified approach with Firestore
    // Query only by eventName to avoid composite index requirement, filter dates in memory
    const analyticsEventsRef = collection(db, 'analytics_events');
    const q = query(
      analyticsEventsRef,
      where('eventName', '==', 'analytics_dashboard_view')
    );
    
    const snapshot = await getDocs(q);
    const allEvents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Filter by date range in memory
    const startTime = dateRange.start.getTime();
    const endTime = dateRange.end.getTime();
    const events = allEvents.filter((event: any) => {
      const eventTime = event.timestamp?.toDate?.() || new Date(event.timestamp || 0);
      const eventTimeMs = eventTime.getTime();
      return eventTimeMs >= startTime && eventTimeMs <= endTime;
    });
    
    // Sort in memory by timestamp (descending)
    events.sort((a: any, b: any) => {
      const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
      const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
      return bTime.getTime() - aTime.getTime();
    });
    
    // Count views by tab
    const tabViews: Record<string, number> = {};
    events.forEach((event: any) => {
      const tab = event.tabName || 'unknown';
      tabViews[tab] = (tabViews[tab] || 0) + 1;
    });
    
    return {
      totalViews: events.length,
      viewsByTab: tabViews,
      uniqueUsers: new Set(events.map((e: any) => e.userId || e.userAgent)).size,
    };
  } catch (error) {
    console.error('Error fetching analytics usage stats:', error);
    return {
      totalViews: 0,
      viewsByTab: {},
      uniqueUsers: 0,
    };
  }
}

/**
 * Get system performance metrics
 */
export async function getPerformanceMetrics(dateRange: { start: Date; end: Date }) {
  try {
    const performanceRef = collection(db, 'analytics_performance');
    const q = query(
      performanceRef,
      where('timestamp', '>=', Timestamp.fromDate(dateRange.start)),
      where('timestamp', '<=', Timestamp.fromDate(dateRange.end)),
      orderBy('timestamp', 'desc'),
      limit(1000)
    );
    
    const snapshot = await getDocs(q);
    const metrics = snapshot.docs.map(doc => doc.data());
    
    // Calculate averages by metric name
    const metricAverages: Record<string, { sum: number; count: number }> = {};
    
    metrics.forEach((metric: any) => {
      const name = metric.metricName || 'unknown';
      if (!metricAverages[name]) {
        metricAverages[name] = { sum: 0, count: 0 };
      }
      metricAverages[name].sum += metric.value || 0;
      metricAverages[name].count++;
    });
    
    const averages: Record<string, number> = {};
    Object.entries(metricAverages).forEach(([name, data]) => {
      averages[name] = data.count > 0 ? Math.round(data.sum / data.count) : 0;
    });
    
    return averages;
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return {};
  }
}

/**
 * Store performance metric in Firestore
 */
export async function storePerformanceMetric(
  metricName: string,
  value: number,
  unit: string = 'ms'
): Promise<void> {
  try {
    const performanceRef = collection(db, 'analytics_performance');
    await setDoc(doc(performanceRef), {
      metricName,
      value,
      unit,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error('Failed to store performance metric:', error);
  }
}

