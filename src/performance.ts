/**
 * Performance monitoring and metrics collection
 * Tracks operation latency and provides performance insights
 */

import { Logger } from './logger';
import { PERF_SLOW_QUERY_THRESHOLD, PERF_SLOW_TRANSACTION_THRESHOLD } from './constants';

export interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private logger: Logger;
  private maxMetricsHistory: number;

  constructor(logger?: Logger, maxHistory: number = 1000) {
    this.logger = logger || new Logger();
    this.maxMetricsHistory = maxHistory;
  }

  /**
   * Start tracking an operation
   */
  startOperation(operationName: string, metadata?: Record<string, unknown>): string {
    const id = `${operationName}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const metric: PerformanceMetrics = {
      operationName,
      startTime: performance.now(),
      success: false,
      metadata,
    };

    this.metrics.push(metric);

    // Trim old metrics if exceeding max history
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    return id;
  }

  /**
   * End tracking an operation
   */
  endOperation(operationName: string, success: boolean, error?: string): void {
    // Find the most recent unfinished operation with this name
    const metric = [...this.metrics]
      .reverse()
      .find(m => m.operationName === operationName && m.endTime === undefined);

    if (!metric) {
      this.logger.warn('Operation not found for performance tracking', { operationName });
      return;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.success = success;
    if (error) {
      metric.error = error;
    }

    // Log slow operations
    this.checkSlowOperation(metric);
  }

  /**
   * Track an async operation
   */
  async trackAsync<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    this.startOperation(operationName, metadata);

    try {
      const result = await operation();
      this.endOperation(operationName, true);
      return result;
    } catch (error) {
      this.endOperation(operationName, false, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Track a synchronous operation
   */
  trackSync<T>(
    operationName: string,
    operation: () => T,
    metadata?: Record<string, unknown>
  ): T {
    this.startOperation(operationName, metadata);

    try {
      const result = operation();
      this.endOperation(operationName, true);
      return result;
    } catch (error) {
      this.endOperation(operationName, false, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private checkSlowOperation(metric: PerformanceMetrics): void {
    if (!metric.duration) return;

    const isTransaction = metric.operationName.toLowerCase().includes('transaction') ||
                         metric.operationName.toLowerCase().includes('buy') ||
                         metric.operationName.toLowerCase().includes('sell');

    const threshold = isTransaction ? PERF_SLOW_TRANSACTION_THRESHOLD : PERF_SLOW_QUERY_THRESHOLD;

    if (metric.duration > threshold) {
      this.logger.warn('Slow operation detected', {
        operation: metric.operationName,
        duration: `${metric.duration.toFixed(2)}ms`,
        threshold: `${threshold}ms`,
        success: metric.success,
        metadata: metric.metadata,
      });
    }
  }

  /**
   * Get statistics for a specific operation
   */
  getOperationStats(operationName: string): {
    count: number;
    successCount: number;
    failureCount: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p50Duration: number;
    p95Duration: number;
    p99Duration: number;
  } {
    const operations = this.metrics.filter(
      m => m.operationName === operationName && m.duration !== undefined
    );

    if (operations.length === 0) {
      return {
        count: 0,
        successCount: 0,
        failureCount: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p50Duration: 0,
        p95Duration: 0,
        p99Duration: 0,
      };
    }

    const durations = operations.map(m => m.duration!).sort((a, b) => a - b);
    const successCount = operations.filter(m => m.success).length;

    return {
      count: operations.length,
      successCount,
      failureCount: operations.length - successCount,
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50Duration: this.percentile(durations, 50),
      p95Duration: this.percentile(durations, 95),
      p99Duration: this.percentile(durations, 99),
    };
  }

  private percentile(sortedArray: number[], p: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((sortedArray.length * p) / 100) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get summary of all operations
   */
  getSummary(): Record<string, ReturnType<typeof this.getOperationStats>> {
    const operationNames = [...new Set(this.metrics.map(m => m.operationName))];
    const summary: Record<string, ReturnType<typeof this.getOperationStats>> = {};

    for (const name of operationNames) {
      summary[name] = this.getOperationStats(name);
    }

    return summary;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get recent slow operations
   */
  getSlowOperations(limit: number = 10): PerformanceMetrics[] {
    return this.metrics
      .filter(m => m.duration !== undefined && m.duration > PERF_SLOW_QUERY_THRESHOLD)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, limit);
  }

  /**
   * Get recent failures
   */
  getRecentFailures(limit: number = 10): PerformanceMetrics[] {
    return this.metrics
      .filter(m => !m.success && m.endTime !== undefined)
      .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
      .slice(0, limit);
  }
}
