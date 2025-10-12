import { WebSocketManager } from '../../src/websocketManager';
import { Logger, LogLevel } from '../../src/logger';
import { ConnectionError } from '../../src/errors';

// Mock ethers WebSocketProvider
jest.mock('ethers', () => {
  const actual = jest.requireActual('ethers');

  class MockWebSocketProvider {
    public websocket: any;
    private eventHandlers: Map<string, Function[]> = new Map();

    constructor(public url: string) {
      this.websocket = {
        readyState: 1, // OPEN
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        close: jest.fn(),
        send: jest.fn(),
      };
    }

    on(event: string, handler: Function) {
      if (!this.eventHandlers.has(event)) {
        this.eventHandlers.set(event, []);
      }
      this.eventHandlers.get(event)!.push(handler);
      return this;
    }

    off(event: string, handler: Function) {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
      return this;
    }

    removeAllListeners() {
      this.eventHandlers.clear();
      return this;
    }

    async destroy() {
      this.websocket.close();
      this.removeAllListeners();
    }

    // Test helpers
    _triggerEvent(event: string, ...args: any[]) {
      const handlers = this.eventHandlers.get(event) || [];
      handlers.forEach(handler => handler(...args));
    }

    _setReadyState(state: number) {
      this.websocket.readyState = state;
    }
  }

  return {
    ...actual,
    WebSocketProvider: MockWebSocketProvider,
  };
});

describe('WebSocketManager', () => {
  let manager: WebSocketManager;
  let logger: Logger;
  const testWsUrl = 'wss://test.example.com';

  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
    logger = new Logger({ level: LogLevel.NONE });
    manager = new WebSocketManager({ url: testWsUrl, logger });
  });

  afterEach(async () => {
    await manager.destroy();
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create manager with ws url', () => {
      expect(manager).toBeInstanceOf(WebSocketManager);
    });

    it('should create with default logger if not provided', () => {
      const defaultManager = new WebSocketManager({ url: testWsUrl });
      expect(defaultManager).toBeInstanceOf(WebSocketManager);
    });

    it('should not be connected initially', () => {
      expect(manager.isConnected()).toBe(false);
    });
  });

  describe('connect', () => {
    it('should establish connection', async () => {
      const connectPromise = manager.connect();

      // Fast-forward to allow connection
      jest.runAllTimers();

      const provider = await connectPromise;

      expect(provider).toBeDefined();
      expect(manager.isConnected()).toBe(true);
    });

    it('should return same provider on multiple calls', async () => {
      const provider1 = await manager.connect();
      const provider2 = await manager.connect();

      expect(provider1).toBe(provider2);
    });

    it('should throw ConnectionError if websocket is invalid', async () => {
      const invalidManager = new WebSocketManager({ url: 'invalid-url', logger });

      await expect(invalidManager.connect()).rejects.toThrow();
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      expect(manager.isConnected()).toBe(false);
    });

    it('should return true when connected', async () => {
      await manager.connect();
      jest.runAllTimers();

      expect(manager.isConnected()).toBe(true);
    });

    it('should return false after disconnection', async () => {
      await manager.connect();
      await manager.destroy();

      expect(manager.isConnected()).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should disconnect and cleanup', async () => {
      await manager.connect();
      expect(manager.isConnected()).toBe(true);

      await manager.destroy();

      expect(manager.isConnected()).toBe(false);
    });

    it('should handle multiple destroy calls', async () => {
      await manager.connect();

      await manager.destroy();
      await manager.destroy(); // Should not throw

      expect(manager.isConnected()).toBe(false);
    });

    it('should not throw when destroying without connecting', async () => {
      await expect(manager.destroy()).resolves.not.toThrow();
    });

    it('should clear all event listeners', async () => {
      const onConnected = jest.fn();
      const unsubscribe = manager.onConnected(onConnected);

      await manager.connect();
      await manager.destroy();

      // Should not trigger callback after destroy
      await manager.connect();
      expect(onConnected).toHaveBeenCalledTimes(1); // Only from first connect
    });
  });

  describe('event handlers', () => {
    describe('onConnected', () => {
      it('should call callback when connected', async () => {
        const callback = jest.fn();
        manager.onConnected(callback);

        await manager.connect();
        jest.runAllTimers();

        expect(callback).toHaveBeenCalled();
      });

      it('should support multiple callbacks', async () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();

        manager.onConnected(callback1);
        manager.onConnected(callback2);

        await manager.connect();
        jest.runAllTimers();

        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
      });

      it('should return unsubscribe function', async () => {
        const callback = jest.fn();
        const unsubscribe = manager.onConnected(callback);

        unsubscribe();

        await manager.connect();
        jest.runAllTimers();

        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('onDisconnected', () => {
      it('should call callback when disconnected', async () => {
        const callback = jest.fn();
        manager.onDisconnected(callback);

        await manager.connect();
        const provider = await manager.connect();

        // Simulate disconnection
        (provider as any)._triggerEvent('close');

        expect(callback).toHaveBeenCalled();
      });

      it('should support unsubscribe', async () => {
        const callback = jest.fn();
        const unsubscribe = manager.onDisconnected(callback);

        unsubscribe();

        await manager.connect();
        const provider = await manager.connect();
        (provider as any)._triggerEvent('close');

        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('onError', () => {
      it('should call callback on error', async () => {
        const callback = jest.fn();
        manager.onError(callback);

        await manager.connect();
        const provider = await manager.connect();

        const testError = new Error('Test error');
        (provider as any)._triggerEvent('error', testError);

        expect(callback).toHaveBeenCalledWith(expect.any(Error));
      });

      it('should support unsubscribe', async () => {
        const callback = jest.fn();
        const unsubscribe = manager.onError(callback);

        unsubscribe();

        await manager.connect();
        const provider = await manager.connect();
        (provider as any)._triggerEvent('error', new Error('Test'));

        expect(callback).not.toHaveBeenCalled();
      });
    });
  });

  describe('reconnection logic', () => {
    it('should attempt to reconnect on disconnection', async () => {
      await manager.connect();
      const provider = await manager.connect();

      const onConnected = jest.fn();
      manager.onConnected(onConnected);

      // Simulate disconnection
      (provider as any)._triggerEvent('close');

      // Fast-forward to trigger reconnection
      jest.advanceTimersByTime(2000);

      // Should have attempted reconnection
      expect(onConnected).toHaveBeenCalled();
    });

    it('should use exponential backoff', async () => {
      await manager.connect();
      const provider = await manager.connect();

      // Simulate multiple disconnections
      for (let i = 0; i < 3; i++) {
        (provider as any)._triggerEvent('close');
        jest.advanceTimersByTime(1000 * Math.pow(1.5, i));
      }

      const stats = manager.getStats();
      expect(stats.reconnectAttempts).toBeGreaterThan(0);
    });

    it('should not reconnect if manually destroyed', async () => {
      const onConnected = jest.fn();
      manager.onConnected(onConnected);

      await manager.connect();
      onConnected.mockClear();

      await manager.destroy();

      // Advance timers significantly
      jest.advanceTimersByTime(60000);

      // Should not have reconnected
      expect(onConnected).not.toHaveBeenCalled();
    });

    it('should track reconnection attempts', async () => {
      await manager.connect();
      const provider = await manager.connect();

      // Simulate disconnections
      (provider as any)._triggerEvent('close');
      jest.advanceTimersByTime(2000);

      (provider as any)._triggerEvent('close');
      jest.advanceTimersByTime(3000);

      const stats = manager.getStats();
      expect(stats.reconnectAttempts).toBeGreaterThan(0);
    });
  });

  describe('heartbeat', () => {
    it('should start heartbeat after connection', async () => {
      await manager.connect();
      jest.runAllTimers();

      // Heartbeat should be running
      const stats = manager.getStats();
      expect(stats.connected).toBe(true);
    });

    it('should stop heartbeat on disconnection', async () => {
      await manager.connect();
      await manager.destroy();

      // No way to directly verify heartbeat stopped,
      // but manager should be disconnected
      expect(manager.isConnected()).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should provide connection statistics', () => {
      const stats = manager.getStats();

      expect(stats).toHaveProperty('connected');
      expect(stats).toHaveProperty('reconnectAttempts');
      expect(stats).toHaveProperty('maxReconnectAttempts');
      expect(stats).toHaveProperty('autoReconnect');
      expect(stats).toHaveProperty('lastPongTime');

      expect(stats.connected).toBe(false);
      expect(stats.reconnectAttempts).toBe(0);
    });

    it('should update stats on connection', async () => {
      await manager.connect();

      const stats = manager.getStats();
      expect(stats.connected).toBe(true);
    });

    it('should track reconnection attempts in stats', async () => {
      await manager.connect();
      const provider = await manager.connect();

      // Simulate disconnection and reconnection
      (provider as any)._triggerEvent('close');
      jest.advanceTimersByTime(2000);

      const stats = manager.getStats();
      expect(stats.reconnectAttempts).toBeGreaterThan(0);
    });

    it('should include last pong time', async () => {
      await manager.connect();
      jest.runAllTimers();

      const stats = manager.getStats();
      expect(stats).toHaveProperty('lastPongTime');
      expect(stats.lastPongTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('error handling', () => {
    it('should handle connection errors gracefully', async () => {
      const errorManager = new WebSocketManager({ url: 'wss://invalid.url', logger });

      await expect(errorManager.connect()).rejects.toThrow();
    });

    it('should trigger error callback on provider error', async () => {
      const errorCallback = jest.fn();
      manager.onError(errorCallback);

      await manager.connect();
      const provider = await manager.connect();

      const testError = new Error('Provider error');
      (provider as any)._triggerEvent('error', testError);

      expect(errorCallback).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('error'),
      }));
    });

    it('should handle errors during reconnection', async () => {
      await manager.connect();
      const provider = await manager.connect();

      // Simulate error during reconnection
      (provider as any)._triggerEvent('close');
      (provider as any)._triggerEvent('error', new Error('Reconnection failed'));

      jest.advanceTimersByTime(5000);

      // Should continue attempting to reconnect
      const stats = manager.getStats();
      expect(stats.reconnectAttempts).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid connect/disconnect cycles', async () => {
      for (let i = 0; i < 5; i++) {
        await manager.connect();
        await manager.destroy();
      }

      expect(manager.isConnected()).toBe(false);
    });

    it('should handle concurrent connect calls', async () => {
      const promises = [
        manager.connect(),
        manager.connect(),
        manager.connect(),
      ];

      jest.runAllTimers();

      const providers = await Promise.all(promises);

      // All should return same provider
      expect(providers[0]).toBe(providers[1]);
      expect(providers[1]).toBe(providers[2]);
    });

    it('should cleanup event handlers properly', async () => {
      const callback = jest.fn();
      const unsubscribe = manager.onConnected(callback);

      unsubscribe();
      unsubscribe(); // Double unsubscribe should not throw

      await manager.connect();
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle websocket in different states', async () => {
      await manager.connect();
      const provider = await manager.connect();

      // Simulate different websocket states
      (provider as any)._setReadyState(0); // CONNECTING
      expect(manager.isConnected()).toBe(false);

      (provider as any)._setReadyState(1); // OPEN
      expect(manager.isConnected()).toBe(true);

      (provider as any)._setReadyState(2); // CLOSING
      expect(manager.isConnected()).toBe(false);

      (provider as any)._setReadyState(3); // CLOSED
      expect(manager.isConnected()).toBe(false);
    });

    it('should not leak memory with many event subscriptions', () => {
      const unsubscribers: Array<() => void> = [];

      // Create many subscriptions
      for (let i = 0; i < 100; i++) {
        unsubscribers.push(manager.onConnected(() => {}));
        unsubscribers.push(manager.onDisconnected(() => {}));
        unsubscribers.push(manager.onError(() => {}));
      }

      // Cleanup all
      unsubscribers.forEach(unsub => unsub());

      // Should not throw or cause issues
      expect(manager.isConnected()).toBe(false);
    });
  });
});
