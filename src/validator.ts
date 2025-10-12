/**
 * Input validation utilities
 * Provides comprehensive validation for all SDK inputs
 */

import { ethers } from 'ethers';
import {
  InvalidAddressError,
  InvalidAmountError,
  GasConfigurationError,
  ValidationError,
} from './errors';
import type { GasOptions } from './fourTrading';

export class Validator {
  /**
   * Validate Ethereum address format
   */
  static validateAddress(address: string, fieldName: string = 'address'): void {
    if (!address || typeof address !== 'string') {
      throw new InvalidAddressError(address);
    }

    if (!ethers.isAddress(address)) {
      throw new InvalidAddressError(address);
    }
  }

  /**
   * Validate bigint amount
   */
  static validateAmount(amount: bigint, fieldName: string = 'amount', options?: {
    min?: bigint;
    max?: bigint;
    allowZero?: boolean;
  }): void {
    if (typeof amount !== 'bigint') {
      throw new InvalidAmountError(amount, `${fieldName} must be bigint type`);
    }

    if (!options?.allowZero && amount === 0n) {
      throw new InvalidAmountError(amount, `${fieldName} must be greater than zero`);
    }

    if (amount < 0n) {
      throw new InvalidAmountError(amount, `${fieldName} cannot be negative`);
    }

    if (options?.min !== undefined && amount < options.min) {
      throw new InvalidAmountError(amount, `${fieldName} must be at least ${options.min}`);
    }

    if (options?.max !== undefined && amount > options.max) {
      throw new InvalidAmountError(amount, `${fieldName} must not exceed ${options.max}`);
    }
  }

  /**
   * Validate gas configuration
   */
  static validateGasOptions(gas: GasOptions): void {
    const hasLegacy = gas.gasPrice !== undefined;
    const hasEIP1559 = gas.maxFeePerGas !== undefined || gas.maxPriorityFeePerGas !== undefined;

    if (hasLegacy && hasEIP1559) {
      throw new GasConfigurationError(
        'Cannot specify both legacy gasPrice and EIP-1559 parameters (maxFeePerGas, maxPriorityFeePerGas)'
      );
    }

    if (gas.gasLimit !== undefined) {
      this.validateAmount(gas.gasLimit, 'gasLimit', { min: 21000n });
    }

    if (gas.gasPrice !== undefined) {
      this.validateAmount(gas.gasPrice, 'gasPrice');
    }

    if (gas.maxFeePerGas !== undefined) {
      this.validateAmount(gas.maxFeePerGas, 'maxFeePerGas');
    }

    if (gas.maxPriorityFeePerGas !== undefined) {
      this.validateAmount(gas.maxPriorityFeePerGas, 'maxPriorityFeePerGas');
    }

    // Validate EIP-1559 relationship
    if (gas.maxFeePerGas !== undefined && gas.maxPriorityFeePerGas !== undefined) {
      if (gas.maxPriorityFeePerGas > gas.maxFeePerGas) {
        throw new GasConfigurationError(
          'maxPriorityFeePerGas cannot exceed maxFeePerGas'
        );
      }
    }
  }

  /**
   * Validate RPC URL format
   */
  static validateRpcUrl(url: string, type: 'http' | 'websocket'): void {
    if (!url || typeof url !== 'string') {
      throw new ValidationError(`Invalid RPC URL: ${url}`);
    }

    try {
      const parsedUrl = new URL(url);

      if (type === 'http' && !['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new ValidationError(`HTTP RPC URL must use http:// or https:// protocol, got: ${parsedUrl.protocol}`);
      }

      if (type === 'websocket' && !['ws:', 'wss:'].includes(parsedUrl.protocol)) {
        throw new ValidationError(`WebSocket RPC URL must use ws:// or wss:// protocol, got: ${parsedUrl.protocol}`);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(`Malformed RPC URL: ${url}`);
    }
  }

  /**
   * Validate private key format
   */
  static validatePrivateKey(privateKey: string): void {
    if (!privateKey || typeof privateKey !== 'string') {
      throw new ValidationError('Private key is required and must be a string');
    }

    // Remove 0x prefix if present
    const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

    // Check if it's valid hex
    if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
      throw new ValidationError('Private key must be 64 hexadecimal characters (with or without 0x prefix)');
    }
  }

  /**
   * Validate slippage percentage
   */
  static validateSlippage(slippagePercent: number): void {
    if (typeof slippagePercent !== 'number' || isNaN(slippagePercent)) {
      throw new ValidationError(`Slippage must be a number, got: ${slippagePercent}`);
    }

    if (slippagePercent < 0 || slippagePercent > 100) {
      throw new ValidationError(`Slippage must be between 0 and 100, got: ${slippagePercent}`);
    }
  }

  /**
   * Validate token addresses are not the same
   */
  static validateDifferentAddresses(address1: string, address2: string, label1: string = 'address1', label2: string = 'address2'): void {
    this.validateAddress(address1, label1);
    this.validateAddress(address2, label2);

    if (address1.toLowerCase() === address2.toLowerCase()) {
      throw new ValidationError(`${label1} and ${label2} must be different addresses`);
    }
  }
}
