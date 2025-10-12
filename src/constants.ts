/**
 * Constants and configuration values
 * Centralized location for all magic numbers and constants
 */

import { WeiPerEther } from 'ethers';

// Numeric constants
export const ONE_ETHER = WeiPerEther;
export const SLIPPAGE_DENOMINATOR = 10000n; // For slippage calculations (basis points)
export const MIN_GAS_LIMIT = 21000n; // Minimum gas limit for any transaction
export const MAX_SLIPPAGE_PERCENT = 100; // Maximum allowed slippage percentage

// Time constants (milliseconds)
export const DEFAULT_CACHE_TTL = 60000; // 1 minute
export const STATIC_DATA_CACHE_TTL = 3600000; // 1 hour for constants/templates
export const TOKEN_INFO_CACHE_TTL = 30000; // 30 seconds for token info
export const BALANCE_CACHE_TTL = 10000; // 10 seconds for balance queries

// WebSocket configuration
export const WS_RECONNECT_INITIAL_DELAY = 1000; // 1 second
export const WS_RECONNECT_MAX_DELAY = 30000; // 30 seconds
export const WS_RECONNECT_MULTIPLIER = 1.5; // Exponential backoff multiplier
export const WS_RECONNECT_MAX_ATTEMPTS = 10; // Maximum reconnection attempts
export const WS_HEARTBEAT_INTERVAL = 30000; // 30 seconds ping interval
export const WS_HEARTBEAT_TIMEOUT = 5000; // 5 seconds ping timeout

// Cache configuration
export const MAX_CACHE_SIZE = 1000; // Maximum number of cached items
export const CACHE_CLEANUP_INTERVAL = 300000; // 5 minutes

// Contract addresses
export const FOUR_MEME_ADDRESS = '0x5c952063c7fc8610FFDB798152D69F0B9550762b';

// Event topics (precomputed for performance)
export const TOKEN_CREATE_TOPIC = '0x396d5e902b675b032348d3d2e9517ee8f0c4a926603fbc075d3d282ff00cad20';

// Function signatures
export const ADD_LIQUIDITY_SIGNATURE = '0xe3412e3d';
export const CREATE_TOKEN_SIGNATURE = '0x519ebb10';
export const BUY_TOKEN_AMAP_SIGNATURE = '0x87f27655';
export const SELL_TOKEN_SIGNATURE = '0xe63aaf36';

// Performance monitoring
export const PERF_SLOW_QUERY_THRESHOLD = 1000; // 1 second
export const PERF_SLOW_TRANSACTION_THRESHOLD = 30000; // 30 seconds

// Batch operation limits
export const MAX_BATCH_SIZE = 50; // Maximum items in a batch operation
export const BATCH_DELAY = 100; // Delay between batched RPC calls (ms)

// Validation limits
export const MAX_UINT256 = 2n ** 256n - 1n;
export const MIN_BNB_AMOUNT = 1000000000000000n; // 0.001 BNB minimum
export const MAX_TOKEN_DECIMALS = 18;

// Provider configuration
export const DEFAULT_POLLING_INTERVAL = 12000; // 12 seconds (BSC block time)
export const TRANSACTION_CONFIRMATION_BLOCKS = 1;
export const TRANSACTION_TIMEOUT = 120000; // 2 minutes

// Error messages
export const ERROR_MESSAGES = {
  INVALID_ADDRESS: 'Invalid Ethereum address format',
  INVALID_AMOUNT: 'Amount must be greater than zero',
  INSUFFICIENT_BALANCE: 'Insufficient balance for transaction',
  GAS_CONFIG_CONFLICT: 'Cannot specify both legacy and EIP-1559 gas parameters',
  SLIPPAGE_EXCEEDED: 'Slippage tolerance exceeded',
  TRANSACTION_TIMEOUT: 'Transaction confirmation timeout',
  WEBSOCKET_DISCONNECTED: 'WebSocket connection lost',
  PROVIDER_ERROR: 'Provider error occurred',
} as const;
