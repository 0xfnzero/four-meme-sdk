import { Logger, LogLevel } from '../../src/logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should use default configuration', () => {
      const logger = new Logger();

      logger.info('test message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).toContain('[FourTrading]');
      expect(message).toContain('[INFO]');
      expect(message).toContain('test message');
    });

    it('should accept custom log level', () => {
      const logger = new Logger({ level: LogLevel.ERROR });

      logger.info('info message');
      logger.error('error message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should accept custom prefix', () => {
      const logger = new Logger({ prefix: '[CustomApp]' });

      logger.info('test message');

      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).toContain('[CustomApp]');
    });

    it('should support disabling timestamps', () => {
      const logger = new Logger({ timestamp: false });

      logger.info('test message');

      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('log level filtering', () => {
    it('should respect DEBUG level', () => {
      const logger = new Logger({ level: LogLevel.DEBUG });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // debug + info
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should respect INFO level (default)', () => {
      const logger = new Logger({ level: LogLevel.INFO });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1); // only info
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should respect WARN level', () => {
      const logger = new Logger({ level: LogLevel.WARN });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should respect ERROR level', () => {
      const logger = new Logger({ level: LogLevel.ERROR });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should respect NONE level (suppress all)', () => {
      const logger = new Logger({ level: LogLevel.NONE });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('message formatting', () => {
    it('should include timestamp by default', () => {
      const logger = new Logger();

      logger.info('test message');

      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });

    it('should include prefix', () => {
      const logger = new Logger({ prefix: '[MyApp]' });

      logger.info('test message');

      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).toContain('[MyApp]');
    });

    it('should include log level', () => {
      const logger = new Logger({ level: LogLevel.DEBUG });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleLogSpy.mock.calls[0][0]).toContain('[DEBUG]');
      expect(consoleLogSpy.mock.calls[1][0]).toContain('[INFO]');
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('[WARN]');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR]');
    });

    it('should include message text', () => {
      const logger = new Logger();
      const testMessage = 'This is a test message';

      logger.info(testMessage);

      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).toContain(testMessage);
    });

    it('should include metadata as JSON', () => {
      const logger = new Logger();
      const meta = { userId: 123, action: 'login' };

      logger.info('User action', meta);

      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).toContain(JSON.stringify(meta));
    });

    it('should handle empty metadata', () => {
      const logger = new Logger();

      logger.info('test message', {});

      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).not.toContain('{}');
    });

    it('should handle undefined metadata', () => {
      const logger = new Logger();

      logger.info('test message');

      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).toContain('test message');
      expect(message).not.toContain('undefined');
    });

    it('should handle complex metadata objects', () => {
      const logger = new Logger();
      const meta = {
        user: { id: 123, name: 'Alice' },
        timestamp: Date.now(),
        tags: ['important', 'security'],
      };

      logger.info('Complex data', meta);

      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).toContain(JSON.stringify(meta));
    });
  });

  describe('setLevel and getLevel', () => {
    it('should update log level dynamically', () => {
      const logger = new Logger({ level: LogLevel.INFO });

      logger.debug('should not appear');
      expect(consoleLogSpy).not.toHaveBeenCalled();

      logger.setLevel(LogLevel.DEBUG);
      logger.debug('should appear');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should get current log level', () => {
      const logger = new Logger({ level: LogLevel.WARN });

      expect(logger.getLevel()).toBe(LogLevel.WARN);

      logger.setLevel(LogLevel.ERROR);
      expect(logger.getLevel()).toBe(LogLevel.ERROR);
    });

    it('should allow switching to NONE', () => {
      const logger = new Logger({ level: LogLevel.INFO });

      logger.info('message 1');
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);

      logger.setLevel(LogLevel.NONE);
      logger.info('message 2');
      logger.error('message 3');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('console method mapping', () => {
    it('should use console.log for DEBUG', () => {
      const logger = new Logger({ level: LogLevel.DEBUG });

      logger.debug('debug message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should use console.log for INFO', () => {
      const logger = new Logger({ level: LogLevel.INFO });

      logger.info('info message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should use console.warn for WARN', () => {
      const logger = new Logger({ level: LogLevel.WARN });

      logger.warn('warn message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should use console.error for ERROR', () => {
      const logger = new Logger({ level: LogLevel.ERROR });

      logger.error('error message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle very long messages', () => {
      const logger = new Logger();
      const longMessage = 'x'.repeat(10000);

      logger.info(longMessage);

      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).toContain(longMessage);
    });

    it('should handle special characters in messages', () => {
      const logger = new Logger();
      const specialMessage = 'Message with "quotes" and \\backslashes\\ and \nnewlines';

      logger.info(specialMessage);

      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).toContain(specialMessage);
    });

    it('should handle metadata with circular references gracefully', () => {
      const logger = new Logger();
      const circular: any = { name: 'circular' };
      circular.self = circular;

      expect(() => {
        logger.info('Circular test', circular);
      }).toThrow(); // JSON.stringify throws on circular references
    });

    it('should handle null and undefined in metadata', () => {
      const logger = new Logger();
      const meta = { value: null, other: undefined };

      logger.info('Null test', meta);

      const message = consoleLogSpy.mock.calls[0][0];
      expect(message).toContain('"value":null');
    });

    it('should be reusable across multiple calls', () => {
      const logger = new Logger({ level: LogLevel.INFO });

      logger.info('message 1');
      logger.info('message 2');
      logger.info('message 3');

      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
    });
  });
});
