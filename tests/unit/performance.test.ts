import { PerformanceMonitor } from '../../src/performance';
import { Logger, LogLevel } from '../../src/logger';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger({ level: LogLevel.NONE }); // Suppress logs in tests
    monitor = new PerformanceMonitor(logger, 100);
  });

  describe('constructor', () => {
    it('should create monitor with default logger', () => {
      const defaultMonitor = new PerformanceMonitor();
      expect(defaultMonitor).toBeInstanceOf(PerformanceMonitor);
    });

    it('should accept custom logger', () => {
      const customLogger = new Logger({ prefix: '[Custom]' });
      const customMonitor = new PerformanceMonitor(customLogger);
      expect(customMonitor).toBeInstanceOf(PerformanceMonitor);
    });

    it('should accept custom max history', () => {
      const smallMonitor = new PerformanceMonitor(logger, 10);

      for (let i = 0; i < 20; i++) {
        smallMonitor.startOperation(`op${i}`);
        smallMonitor.endOperation(`op${i}`, true);
      }

      const metrics = smallMonitor.getAllMetrics();
      expect(metrics.length).toBeLessThanOrEqual(10);
    });
  });

  describe('startOperation and endOperation', () => {
    it('should track operation start', () => {
      const id = monitor.startOperation('testOp');

      expect(id).toContain('testOp_');

      const metrics = monitor.getAllMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].operationName).toBe('testOp');
      expect(metrics[0].success).toBe(false);
      expect(metrics[0].endTime).toBeUndefined();
    });

    it('should track operation end', () => {
      monitor.startOperation('testOp');
      monitor.endOperation('testOp', true);

      const metrics = monitor.getAllMetrics();
      expect(metrics[0].success).toBe(true);
      expect(metrics[0].endTime).toBeDefined();
      expect(metrics[0].duration).toBeDefined();
      expect(metrics[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('should track failed operations', () => {
      monitor.startOperation('failOp');
      monitor.endOperation('failOp', false, 'Test error');

      const metrics = monitor.getAllMetrics();
      expect(metrics[0].success).toBe(false);
      expect(metrics[0].error).toBe('Test error');
    });

    it('should handle metadata', () => {
      const metadata = { userId: 123, action: 'test' };
      monitor.startOperation('metaOp', metadata);
      monitor.endOperation('metaOp', true);

      const metrics = monitor.getAllMetrics();
      expect(metrics[0].metadata).toEqual(metadata);
    });

    it('should track multiple operations', () => {
      monitor.startOperation('op1');
      monitor.startOperation('op2');
      monitor.startOperation('op3');

      expect(monitor.getAllMetrics().length).toBe(3);

      monitor.endOperation('op1', true);
      monitor.endOperation('op2', true);
      monitor.endOperation('op3', false);

      const metrics = monitor.getAllMetrics();
      expect(metrics.filter(m => m.success).length).toBe(2);
      expect(metrics.filter(m => !m.success).length).toBe(1);
    });

    it('should handle ending non-existent operation', () => {
      // Should not throw
      monitor.endOperation('nonExistent', true);
    });

    it('should track nested operations with same name', () => {
      monitor.startOperation('nested');
      monitor.startOperation('nested');

      monitor.endOperation('nested', true); // Ends second one

      const metrics = monitor.getAllMetrics();
      expect(metrics.length).toBe(2);
      expect(metrics[0].endTime).toBeUndefined();
      expect(metrics[1].endTime).toBeDefined();
    });
  });

  describe('trackAsync', () => {
    it('should track successful async operation', async () => {
      const result = await monitor.trackAsync('asyncOp', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'success';
      });

      expect(result).toBe('success');

      const metrics = monitor.getAllMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].success).toBe(true);
      expect(metrics[0].duration).toBeGreaterThanOrEqual(10);
    });

    it('should track failed async operation', async () => {
      await expect(
        monitor.trackAsync('failAsync', async () => {
          throw new Error('Async failure');
        })
      ).rejects.toThrow('Async failure');

      const metrics = monitor.getAllMetrics();
      expect(metrics[0].success).toBe(false);
      expect(metrics[0].error).toBe('Async failure');
    });

    it('should track async operation with metadata', async () => {
      const metadata = { type: 'database', query: 'SELECT *' };

      await monitor.trackAsync(
        'dbQuery',
        async () => 'result',
        metadata
      );

      const metrics = monitor.getAllMetrics();
      expect(metrics[0].metadata).toEqual(metadata);
    });

    it('should handle promise rejection with non-Error', async () => {
      await expect(
        monitor.trackAsync('rejectString', async () => {
          throw 'string error';
        })
      ).rejects.toBe('string error');

      const metrics = monitor.getAllMetrics();
      expect(metrics[0].error).toBe('string error');
    });
  });

  describe('trackSync', () => {
    it('should track successful sync operation', () => {
      const result = monitor.trackSync('syncOp', () => {
        return 42;
      });

      expect(result).toBe(42);

      const metrics = monitor.getAllMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].success).toBe(true);
      expect(metrics[0].duration).toBeDefined();
    });

    it('should track failed sync operation', () => {
      expect(() => {
        monitor.trackSync('failSync', () => {
          throw new Error('Sync failure');
        });
      }).toThrow('Sync failure');

      const metrics = monitor.getAllMetrics();
      expect(metrics[0].success).toBe(false);
      expect(metrics[0].error).toBe('Sync failure');
    });

    it('should track sync operation with metadata', () => {
      const metadata = { calculation: 'sum' };

      monitor.trackSync('calc', () => 1 + 1, metadata);

      const metrics = monitor.getAllMetrics();
      expect(metrics[0].metadata).toEqual(metadata);
    });
  });

  describe('getOperationStats', () => {
    beforeEach(() => {
      // Create test data
      for (let i = 0; i < 10; i++) {
        monitor.startOperation('testOp');
        monitor.endOperation('testOp', i < 8); // 8 successes, 2 failures
      }
    });

    it('should calculate correct statistics', () => {
      const stats = monitor.getOperationStats('testOp');

      expect(stats.count).toBe(10);
      expect(stats.successCount).toBe(8);
      expect(stats.failureCount).toBe(2);
      expect(stats.avgDuration).toBeGreaterThanOrEqual(0);
      expect(stats.minDuration).toBeGreaterThanOrEqual(0);
      expect(stats.maxDuration).toBeGreaterThanOrEqual(stats.minDuration);
      expect(stats.p50Duration).toBeGreaterThanOrEqual(0);
      expect(stats.p95Duration).toBeGreaterThanOrEqual(0);
      expect(stats.p99Duration).toBeGreaterThanOrEqual(0);
    });

    it('should return zero stats for non-existent operation', () => {
      const stats = monitor.getOperationStats('nonExistent');

      expect(stats.count).toBe(0);
      expect(stats.successCount).toBe(0);
      expect(stats.failureCount).toBe(0);
      expect(stats.avgDuration).toBe(0);
      expect(stats.minDuration).toBe(0);
      expect(stats.maxDuration).toBe(0);
      expect(stats.p50Duration).toBe(0);
      expect(stats.p95Duration).toBe(0);
      expect(stats.p99Duration).toBe(0);
    });

    it('should calculate percentiles correctly', () => {
      const stats = monitor.getOperationStats('testOp');

      // Percentiles should be ordered
      expect(stats.p50Duration).toBeLessThanOrEqual(stats.p95Duration);
      expect(stats.p95Duration).toBeLessThanOrEqual(stats.p99Duration);
      expect(stats.p99Duration).toBeLessThanOrEqual(stats.maxDuration);
    });

    it('should handle single operation', () => {
      monitor.startOperation('singleOp');
      monitor.endOperation('singleOp', true);

      const stats = monitor.getOperationStats('singleOp');

      expect(stats.count).toBe(1);
      expect(stats.avgDuration).toBe(stats.minDuration);
      expect(stats.avgDuration).toBe(stats.maxDuration);
      expect(stats.p50Duration).toBe(stats.avgDuration);
    });
  });

  describe('getSummary', () => {
    it('should provide summary for all operations', () => {
      monitor.startOperation('op1');
      monitor.endOperation('op1', true);

      monitor.startOperation('op2');
      monitor.endOperation('op2', false);

      monitor.startOperation('op3');
      monitor.endOperation('op3', true);

      const summary = monitor.getSummary();

      expect(Object.keys(summary)).toContain('op1');
      expect(Object.keys(summary)).toContain('op2');
      expect(Object.keys(summary)).toContain('op3');

      expect(summary.op1.count).toBe(1);
      expect(summary.op2.count).toBe(1);
      expect(summary.op3.count).toBe(1);
    });

    it('should return empty summary for no operations', () => {
      const summary = monitor.getSummary();
      expect(Object.keys(summary).length).toBe(0);
    });

    it('should aggregate multiple calls to same operation', () => {
      for (let i = 0; i < 5; i++) {
        monitor.startOperation('repeated');
        monitor.endOperation('repeated', true);
      }

      const summary = monitor.getSummary();
      expect(summary.repeated.count).toBe(5);
    });
  });

  describe('clear', () => {
    it('should clear all metrics', () => {
      monitor.startOperation('op1');
      monitor.startOperation('op2');
      monitor.endOperation('op1', true);
      monitor.endOperation('op2', true);

      expect(monitor.getAllMetrics().length).toBe(2);

      monitor.clear();

      expect(monitor.getAllMetrics().length).toBe(0);
    });

    it('should allow tracking after clear', () => {
      monitor.startOperation('op1');
      monitor.clear();

      monitor.startOperation('op2');
      monitor.endOperation('op2', true);

      const metrics = monitor.getAllMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].operationName).toBe('op2');
    });
  });

  describe('getSlowOperations', () => {
    it('should identify slow operations', async () => {
      // Fast operation
      await monitor.trackAsync('fast', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Slow operation
      await monitor.trackAsync('slow', async () => {
        await new Promise(resolve => setTimeout(resolve, 1100));
      });

      const slowOps = monitor.getSlowOperations();
      expect(slowOps.length).toBe(1);
      expect(slowOps[0].operationName).toBe('slow');
      expect(slowOps[0].duration).toBeGreaterThan(1000);
    });

    it('should limit results', async () => {
      // Create multiple slow operations
      for (let i = 0; i < 5; i++) {
        await monitor.trackAsync(`slow${i}`, async () => {
          await new Promise(resolve => setTimeout(resolve, 1100));
        });
      }

      const slowOps = monitor.getSlowOperations(3);
      expect(slowOps.length).toBe(3);
    });

    it('should sort by duration descending', async () => {
      await monitor.trackAsync('slow1', async () => {
        await new Promise(resolve => setTimeout(resolve, 1100));
      });

      await monitor.trackAsync('slow2', async () => {
        await new Promise(resolve => setTimeout(resolve, 1200));
      });

      await monitor.trackAsync('slow3', async () => {
        await new Promise(resolve => setTimeout(resolve, 1050));
      });

      const slowOps = monitor.getSlowOperations();
      expect(slowOps[0].operationName).toBe('slow2'); // slowest
      expect(slowOps[2].operationName).toBe('slow3'); // least slow
    });
  });

  describe('getRecentFailures', () => {
    it('should get recent failures', () => {
      monitor.startOperation('success1');
      monitor.endOperation('success1', true);

      monitor.startOperation('fail1');
      monitor.endOperation('fail1', false, 'Error 1');

      monitor.startOperation('fail2');
      monitor.endOperation('fail2', false, 'Error 2');

      const failures = monitor.getRecentFailures();
      expect(failures.length).toBe(2);
      expect(failures[0].operationName).toBe('fail2'); // Most recent
      expect(failures[1].operationName).toBe('fail1');
    });

    it('should limit results', () => {
      for (let i = 0; i < 5; i++) {
        monitor.startOperation(`fail${i}`);
        monitor.endOperation(`fail${i}`, false, `Error ${i}`);
      }

      const failures = monitor.getRecentFailures(3);
      expect(failures.length).toBe(3);
    });

    it('should not include unfinished operations', () => {
      monitor.startOperation('incomplete');

      monitor.startOperation('fail1');
      monitor.endOperation('fail1', false);

      const failures = monitor.getRecentFailures();
      expect(failures.length).toBe(1);
      expect(failures[0].operationName).toBe('fail1');
    });
  });

  describe('history management', () => {
    it('should respect max history limit', () => {
      const smallMonitor = new PerformanceMonitor(logger, 5);

      for (let i = 0; i < 10; i++) {
        smallMonitor.startOperation(`op${i}`);
        smallMonitor.endOperation(`op${i}`, true);
      }

      const metrics = smallMonitor.getAllMetrics();
      expect(metrics.length).toBe(5);

      // Should keep most recent operations
      expect(metrics[0].operationName).toBe('op5');
      expect(metrics[4].operationName).toBe('op9');
    });

    it('should handle default max history', () => {
      const defaultMonitor = new PerformanceMonitor(logger);

      for (let i = 0; i < 100; i++) {
        defaultMonitor.startOperation(`op${i}`);
        defaultMonitor.endOperation(`op${i}`, true);
      }

      const metrics = defaultMonitor.getAllMetrics();
      expect(metrics.length).toBe(100);
    });
  });

  describe('edge cases', () => {
    it('should handle operations with same timestamp', () => {
      const id1 = monitor.startOperation('op1');
      const id2 = monitor.startOperation('op1');

      expect(id1).not.toBe(id2); // IDs should be unique
    });

    it('should handle very fast operations', () => {
      monitor.trackSync('instant', () => 1 + 1);

      const metrics = monitor.getAllMetrics();
      expect(metrics[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle getAllMetrics returning copy', () => {
      monitor.startOperation('op1');

      const metrics1 = monitor.getAllMetrics();
      const metrics2 = monitor.getAllMetrics();

      expect(metrics1).not.toBe(metrics2); // Different array instances
      expect(metrics1).toEqual(metrics2); // Same content
    });
  });
});
