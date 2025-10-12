// Main entry point for FOUR Trading SDK
export {
  FourTrading,
  FourTradingConfig,
  BuyParams,
  SellParams,
  CreateTokenParams,
  GasOptions,
  TokenCreateListener,
  TokenPurchaseListener,
  TokenSaleListener,
  LiquidityAddedListener,
} from './fourTrading';

export {
  TokenInfo,
  TokenInfoEx,
  Template,
  TokenStatus,
  TransactionResult,
  TokenCreateEvent,
  TokenPurchaseEvent,
  TokenSaleEvent,
  LiquidityAddedEvent,
} from './types';

export { FOUR_TRADING_ABI } from './abi';

export { PriceCalculator, PriceInfo } from './priceCalculator';

// Error classes
export {
  FourTradingError,
  ValidationError,
  InvalidAddressError,
  InvalidAmountError,
  InsufficientBalanceError,
  TransactionFailedError,
  ConnectionError,
  GasConfigurationError,
  SlippageExceededError,
  FeeExceedsAmountError,
} from './errors';

// Logger
export { Logger, LogLevel, LoggerConfig } from './logger';

// Cache
export { Cache, CacheConfig } from './cache';

// Validator
export { Validator } from './validator';

// Performance monitoring
export { PerformanceMonitor, PerformanceMetrics } from './performance';

// WebSocket manager
export { WebSocketManager, WebSocketManagerConfig } from './websocketManager';

// Constants
export * from './constants';

// Utility functions
export {
  parseTradeEvents,
  parseTokenCreateEvent,
  formatTimestamp,
  formatBNB,
  formatTokenAmount,
  parseBNB,
  parseTokenAmount,
  calculatePriceChange,
  isValidAddress,
  normalizeAddress,
  isFourMemeTransaction,
  getTransactionType,
  calculateGasCost,
  waitForTransaction,
  FOUR_MEME_ADDRESS,
  TOKEN_CREATE_TOPIC,
  ADD_LIQUIDITY_SIGNATURE,
  CREATE_TOKEN_SIGNATURE,
} from './utils';
