/**
 * WebSocket connection manager with automatic reconnection
 * Implements exponential backoff and heartbeat monitoring
 */

import { WebSocketProvider } from 'ethers';
import { Logger } from './logger';
import { ConnectionError } from './errors';
import {
  WS_RECONNECT_INITIAL_DELAY,
  WS_RECONNECT_MAX_DELAY,
  WS_RECONNECT_MULTIPLIER,
  WS_RECONNECT_MAX_ATTEMPTS,
  WS_HEARTBEAT_INTERVAL,
  WS_HEARTBEAT_TIMEOUT,
} from './constants';

export interface WebSocketManagerConfig {
  url: string;
  logger?: Logger;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  heartbeatEnabled?: boolean;
}

export class WebSocketManager {
  private provider: WebSocketProvider | null = null;
  private url: string;
  private logger: Logger;
  private autoReconnect: boolean;
  private maxReconnectAttempts: number;
  private heartbeatEnabled: boolean;

  // Reconnection state
  private reconnectAttempts = 0;
  private reconnectDelay = WS_RECONNECT_INITIAL_DELAY;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isDestroyed = false;

  // Heartbeat state
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private heartbeatTimeoutTimer: NodeJS.Timeout | null = null;
  private lastPongTime = 0;

  // Event handlers
  private onConnectedCallbacks: Array<() => void> = [];
  private onDisconnectedCallbacks: Array<() => void> = [];
  private onErrorCallbacks: Array<(error: Error) => void> = [];

  constructor(config: WebSocketManagerConfig) {
    this.url = config.url;
    this.logger = config.logger || new Logger();
    this.autoReconnect = config.autoReconnect ?? true;
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? WS_RECONNECT_MAX_ATTEMPTS;
    this.heartbeatEnabled = config.heartbeatEnabled ?? true;
  }

  async connect(): Promise<WebSocketProvider> {
    if (this.provider) {
      return this.provider;
    }

    try {
      this.logger.info('Connecting to WebSocket', { url: this.url });

      this.provider = new WebSocketProvider(this.url);

      // Setup event listeners
      this.setupEventListeners();

      // Start heartbeat if enabled
      if (this.heartbeatEnabled) {
        this.startHeartbeat();
      }

      // Reset reconnection state on successful connection
      this.reconnectAttempts = 0;
      this.reconnectDelay = WS_RECONNECT_INITIAL_DELAY;

      this.logger.info('WebSocket connected successfully');
      this.notifyConnected();

      return this.provider;
    } catch (error) {
      this.logger.error('WebSocket connection failed', { error });
      throw new ConnectionError('Failed to establish WebSocket connection', { url: this.url, error });
    }
  }

  private setupEventListeners(): void {
    if (!this.provider?.websocket) return;

    const ws = this.provider.websocket as any;

    ws.on('close', () => {
      this.logger.warn('WebSocket connection closed');
      this.handleDisconnection();
    });

    ws.on('error', (error: Error) => {
      this.logger.error('WebSocket error', { error: error.message });
      this.notifyError(error);
    });

    ws.on('pong', () => {
      this.lastPongTime = Date.now();
    });
  }

  private handleDisconnection(): void {
    this.stopHeartbeat();
    this.provider = null;
    this.notifyDisconnected();

    if (this.autoReconnect && !this.isDestroyed) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max reconnection attempts reached', {
        attempts: this.reconnectAttempts,
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(WS_RECONNECT_MULTIPLIER, this.reconnectAttempts - 1),
      WS_RECONNECT_MAX_DELAY
    );

    this.logger.info('Scheduling WebSocket reconnection', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delay,
    });

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        this.logger.error('Reconnection attempt failed', { error });
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (!this.provider?.websocket) return;

      const ws = this.provider.websocket as any;

      // Send ping
      ws.ping();

      // Set timeout for pong response
      this.heartbeatTimeoutTimer = setTimeout(() => {
        const timeSinceLastPong = Date.now() - this.lastPongTime;

        if (timeSinceLastPong > WS_HEARTBEAT_TIMEOUT * 2) {
          this.logger.warn('WebSocket heartbeat timeout, connection may be dead');
          (this.provider?.websocket as any)?.terminate();
        }
      }, WS_HEARTBEAT_TIMEOUT);
    }, WS_HEARTBEAT_INTERVAL);

    this.lastPongTime = Date.now();
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  getProvider(): WebSocketProvider | null {
    return this.provider;
  }

  isConnected(): boolean {
    return this.provider !== null && this.provider.websocket?.readyState === 1; // WebSocket.OPEN
  }

  async destroy(): Promise<void> {
    this.isDestroyed = true;
    this.autoReconnect = false;

    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    // Close connection
    if (this.provider) {
      try {
        if (this.provider.websocket) {
          this.provider.websocket.close();
        }
        await this.provider.destroy();
      } catch (error) {
        this.logger.error('Error destroying WebSocket provider', { error });
      }
      this.provider = null;
    }

    // Clear callbacks
    this.onConnectedCallbacks = [];
    this.onDisconnectedCallbacks = [];
    this.onErrorCallbacks = [];

    this.logger.info('WebSocket manager destroyed');
  }

  // Event subscription methods
  onConnected(callback: () => void): () => void {
    this.onConnectedCallbacks.push(callback);
    return () => {
      const index = this.onConnectedCallbacks.indexOf(callback);
      if (index > -1) {
        this.onConnectedCallbacks.splice(index, 1);
      }
    };
  }

  onDisconnected(callback: () => void): () => void {
    this.onDisconnectedCallbacks.push(callback);
    return () => {
      const index = this.onDisconnectedCallbacks.indexOf(callback);
      if (index > -1) {
        this.onDisconnectedCallbacks.splice(index, 1);
      }
    };
  }

  onError(callback: (error: Error) => void): () => void {
    this.onErrorCallbacks.push(callback);
    return () => {
      const index = this.onErrorCallbacks.indexOf(callback);
      if (index > -1) {
        this.onErrorCallbacks.splice(index, 1);
      }
    };
  }

  private notifyConnected(): void {
    for (const callback of this.onConnectedCallbacks) {
      try {
        callback();
      } catch (error) {
        this.logger.error('Error in onConnected callback', { error });
      }
    }
  }

  private notifyDisconnected(): void {
    for (const callback of this.onDisconnectedCallbacks) {
      try {
        callback();
      } catch (error) {
        this.logger.error('Error in onDisconnected callback', { error });
      }
    }
  }

  private notifyError(error: Error): void {
    for (const callback of this.onErrorCallbacks) {
      try {
        callback(error);
      } catch (err) {
        this.logger.error('Error in onError callback', { error: err });
      }
    }
  }

  // Statistics
  getStats(): {
    connected: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    autoReconnect: boolean;
    lastPongTime: number;
  } {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      autoReconnect: this.autoReconnect,
      lastPongTime: this.lastPongTime,
    };
  }
}
