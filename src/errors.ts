/**
 * Custom error types for FOUR Trading SDK
 * Provides better error handling and debugging capabilities
 */

export class FourTradingError extends Error {
  constructor(message: string, public readonly code: string, public readonly details?: unknown) {
    super(message);
    this.name = 'FourTradingError';
    Object.setPrototypeOf(this, FourTradingError.prototype);
  }
}

export class ValidationError extends FourTradingError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class InvalidAddressError extends ValidationError {
  constructor(address: string) {
    super(`Invalid address format: ${address}`, { address });
    this.name = 'InvalidAddressError';
    Object.setPrototypeOf(this, InvalidAddressError.prototype);
  }
}

export class InvalidAmountError extends ValidationError {
  constructor(amount: bigint, reason: string) {
    super(`Invalid amount: ${reason}`, { amount: amount.toString(), reason });
    this.name = 'InvalidAmountError';
    Object.setPrototypeOf(this, InvalidAmountError.prototype);
  }
}

export class InsufficientBalanceError extends FourTradingError {
  constructor(required: bigint, available: bigint) {
    super(
      `Insufficient balance: required ${required}, available ${available}`,
      'INSUFFICIENT_BALANCE',
      { required: required.toString(), available: available.toString() }
    );
    this.name = 'InsufficientBalanceError';
    Object.setPrototypeOf(this, InsufficientBalanceError.prototype);
  }
}

export class TransactionFailedError extends FourTradingError {
  constructor(message: string, public readonly txHash?: string, details?: unknown) {
    super(message, 'TRANSACTION_FAILED', { txHash, ...(typeof details === 'object' && details !== null ? details as object : {}) });
    this.name = 'TransactionFailedError';
    Object.setPrototypeOf(this, TransactionFailedError.prototype);
  }
}

export class ConnectionError extends FourTradingError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONNECTION_ERROR', details);
    this.name = 'ConnectionError';
    Object.setPrototypeOf(this, ConnectionError.prototype);
  }
}

export class GasConfigurationError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = 'GasConfigurationError';
    Object.setPrototypeOf(this, GasConfigurationError.prototype);
  }
}

export class SlippageExceededError extends FourTradingError {
  constructor(expected: bigint, actual: bigint) {
    super(
      `Slippage exceeded: expected ${expected}, got ${actual}`,
      'SLIPPAGE_EXCEEDED',
      { expected: expected.toString(), actual: actual.toString() }
    );
    this.name = 'SlippageExceededError';
    Object.setPrototypeOf(this, SlippageExceededError.prototype);
  }
}

export class FeeExceedsAmountError extends ValidationError {
  constructor(fee: bigint, amount: bigint) {
    super(
      `Trading fee ${fee} exceeds or equals amount ${amount}`,
      { fee: fee.toString(), amount: amount.toString() }
    );
    this.name = 'FeeExceedsAmountError';
    Object.setPrototypeOf(this, FeeExceedsAmountError.prototype);
  }
}
