/**
 * Price calculation engine with caching and validation
 * Optimized for performance with intelligent caching layer
 */

import { ethers } from 'ethers';
import { TokenInfo } from './types';
import { Validator } from './validator';
import { Cache } from './cache';
import { FeeExceedsAmountError } from './errors';
import { ONE_ETHER, SLIPPAGE_DENOMINATOR, TOKEN_INFO_CACHE_TTL } from './constants';

export interface PriceInfo {
  tokenAmount: bigint;
  bnbCost: bigint;
  pricePerToken: bigint;
  fee: bigint;
}

export class PriceCalculator {
  private contract: ethers.Contract;
  private tokenInfoCache: Cache<string, TokenInfo>;

  constructor(contract: ethers.Contract) {
    this.contract = contract;
    this.tokenInfoCache = new Cache({ defaultTTL: TOKEN_INFO_CACHE_TTL, maxSize: 500 });
  }

  /**
   * Get token information with caching
   */
  async getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
    Validator.validateAddress(tokenAddress, 'tokenAddress');

    // Check cache first
    const cached = this.tokenInfoCache.get(tokenAddress.toLowerCase());
    if (cached) {
      return cached;
    }

    // Fetch from contract
    const info = await this.contract._tokenInfos(tokenAddress);
    const tokenInfo: TokenInfo = {
      base: info.base,
      quote: info.quote,
      template: info.template,
      totalSupply: info.totalSupply,
      maxOffers: info.maxOffers,
      maxRaising: info.maxRaising,
      launchTime: info.launchTime,
      offers: info.offers,
      funds: info.funds,
      lastPrice: info.lastPrice,
      K: info.K,
      T: info.T,
      status: info.status,
    };

    // Cache the result
    this.tokenInfoCache.set(tokenAddress.toLowerCase(), tokenInfo);

    return tokenInfo;
  }

  /**
   * Quote buy price with validation
   */
  async quoteBuy(tokenAddress: string, bnbAmount: bigint): Promise<PriceInfo> {
    Validator.validateAddress(tokenAddress, 'tokenAddress');
    Validator.validateAmount(bnbAmount, 'bnbAmount');

    const tokenInfo = await this.getTokenInfo(tokenAddress);
    const fee: bigint = await this.contract.calcTradingFee(tokenInfo, bnbAmount);

    // Validate fee doesn't exceed amount
    if (fee >= bnbAmount) {
      throw new FeeExceedsAmountError(fee, bnbAmount);
    }

    const fundsAfterFee: bigint = bnbAmount - fee;
    const tokenAmount: bigint = await this.contract.calcBuyAmount(tokenInfo, fundsAfterFee);
    const pricePerToken: bigint = tokenAmount > 0n ? (bnbAmount * ONE_ETHER) / tokenAmount : 0n;

    return { tokenAmount, bnbCost: bnbAmount, pricePerToken, fee };
  }

  /**
   * Quote sell price with validation
   */
  async quoteSell(tokenAddress: string, tokenAmount: bigint): Promise<PriceInfo> {
    Validator.validateAddress(tokenAddress, 'tokenAddress');
    Validator.validateAmount(tokenAmount, 'tokenAmount');

    const tokenInfo = await this.getTokenInfo(tokenAddress);
    const bnbBeforeFee: bigint = await this.contract.calcSellCost(tokenInfo, tokenAmount);
    const fee: bigint = await this.contract.calcTradingFee(tokenInfo, bnbBeforeFee);

    // Validate fee doesn't exceed proceeds
    if (fee >= bnbBeforeFee) {
      throw new FeeExceedsAmountError(fee, bnbBeforeFee);
    }

    const bnbCost: bigint = bnbBeforeFee - fee;
    const pricePerToken: bigint = tokenAmount > 0n ? (bnbCost * ONE_ETHER) / tokenAmount : 0n;

    return { tokenAmount, bnbCost, pricePerToken, fee };
  }

  /**
   * Calculate cost to buy exact token amount
   */
  async calcBuyCost(tokenInfo: TokenInfo, tokenAmount: bigint): Promise<PriceInfo> {
    Validator.validateAmount(tokenAmount, 'tokenAmount');

    const bnbBeforeFee: bigint = await this.contract.calcBuyCost(tokenInfo, tokenAmount);
    const fee: bigint = await this.contract.calcTradingFee(tokenInfo, bnbBeforeFee);
    const bnbCost: bigint = bnbBeforeFee + fee;
    const pricePerToken: bigint = tokenAmount > 0n ? (bnbCost * ONE_ETHER) / tokenAmount : 0n;

    return { tokenAmount, bnbCost, pricePerToken, fee };
  }

  /**
   * Get current token price
   */
  async getCurrentPrice(tokenAddress: string): Promise<bigint> {
    Validator.validateAddress(tokenAddress, 'tokenAddress');

    const tokenInfo = await this.getTokenInfo(tokenAddress);
    return await this.contract.calcLastPrice(tokenInfo);
  }

  /**
   * Estimate minimum tokens with slippage protection
   */
  async estimateBuySlippage(tokenAddress: string, bnbAmount: bigint, slippagePercent: number): Promise<bigint> {
    Validator.validateAddress(tokenAddress, 'tokenAddress');
    Validator.validateAmount(bnbAmount, 'bnbAmount');
    Validator.validateSlippage(slippagePercent);

    const priceInfo = await this.quoteBuy(tokenAddress, bnbAmount);
    const slippageFactor = BigInt(Math.floor((100 - slippagePercent) * 100));
    return (priceInfo.tokenAmount * slippageFactor) / SLIPPAGE_DENOMINATOR;
  }

  /**
   * Estimate minimum BNB with slippage protection
   */
  async estimateSellSlippage(tokenAddress: string, tokenAmount: bigint, slippagePercent: number): Promise<bigint> {
    Validator.validateAddress(tokenAddress, 'tokenAddress');
    Validator.validateAmount(tokenAmount, 'tokenAmount');
    Validator.validateSlippage(slippagePercent);

    const priceInfo = await this.quoteSell(tokenAddress, tokenAmount);
    const slippageFactor = BigInt(Math.floor((100 - slippagePercent) * 100));
    return (priceInfo.bnbCost * slippageFactor) / SLIPPAGE_DENOMINATOR;
  }

  /**
   * Clear token info cache
   */
  clearCache(): void {
    this.tokenInfoCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): ReturnType<Cache<string, TokenInfo>['stats']> {
    return this.tokenInfoCache.stats();
  }
}
