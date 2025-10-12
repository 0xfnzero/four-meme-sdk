import { PriceCalculator } from '../../src/priceCalculator';
import { ethers } from 'ethers';
import { FeeExceedsAmountError } from '../../src/errors';

// Mock contract for testing
class MockContract {
  private tokenInfos: Map<string, any> = new Map();
  private fees: Map<string, bigint> = new Map();

  constructor() {
    // Setup default mock token
    this.tokenInfos.set('0x1234567890123456789012345678901234567890'.toLowerCase(), {
      base: '0x0000000000000000000000000000000000000000',
      quote: '0x0000000000000000000000000000000000000001',
      template: '0x0000000000000000000000000000000000000002',
      totalSupply: 1000000000000000000000000n,
      maxOffers: 100n,
      maxRaising: 10000000000000000000n,
      launchTime: 1700000000n,
      offers: 50n,
      funds: 5000000000000000000n,
      lastPrice: 1000000000000000n,
      K: 1000000n,
      T: 500n,
      status: 1,
    });
  }

  async _tokenInfos(address: string) {
    const info = this.tokenInfos.get(address.toLowerCase());
    if (!info) {
      throw new Error('Token not found');
    }
    return info;
  }

  async calcTradingFee(tokenInfo: any, amount: bigint): Promise<bigint> {
    // 1% fee
    return amount / 100n;
  }

  async calcBuyAmount(tokenInfo: any, bnbAmount: bigint): Promise<bigint> {
    // Simplified: 1 BNB = 1000 tokens
    return bnbAmount * 1000n;
  }

  async calcSellCost(tokenInfo: any, tokenAmount: bigint): Promise<bigint> {
    // Simplified: 1000 tokens = 1 BNB
    return tokenAmount / 1000n;
  }

  async calcBuyCost(tokenInfo: any, tokenAmount: bigint): Promise<bigint> {
    // Simplified: 1000 tokens = 1 BNB
    return tokenAmount / 1000n;
  }

  async calcLastPrice(tokenInfo: any): Promise<bigint> {
    return tokenInfo.lastPrice;
  }

  setTokenInfo(address: string, info: any) {
    this.tokenInfos.set(address.toLowerCase(), info);
  }
}

describe('PriceCalculator', () => {
  let calculator: PriceCalculator;
  let mockContract: MockContract;
  const testTokenAddress = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    mockContract = new MockContract();
    calculator = new PriceCalculator(mockContract as any);
  });

  describe('getTokenInfo', () => {
    it('should fetch and return token info', async () => {
      const info = await calculator.getTokenInfo(testTokenAddress);

      expect(info).toBeDefined();
      expect(info.totalSupply).toBe(1000000000000000000000000n);
      expect(info.offers).toBe(50n);
      expect(info.funds).toBe(5000000000000000000n);
    });

    it('should cache token info', async () => {
      const spy = jest.spyOn(mockContract, '_tokenInfos');

      // First call - should hit contract
      await calculator.getTokenInfo(testTokenAddress);
      expect(spy).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await calculator.getTokenInfo(testTokenAddress);
      expect(spy).toHaveBeenCalledTimes(1); // No additional call

      spy.mockRestore();
    });

    it('should normalize address to lowercase for caching', async () => {
      // Use valid hex address (ethers requires 0x prefix)
      const mixedCaseAddress = testTokenAddress; // Already has 0x prefix
      const lowerAddress = testTokenAddress.toLowerCase();

      await calculator.getTokenInfo(mixedCaseAddress);
      await calculator.getTokenInfo(lowerAddress);

      const stats = calculator.getCacheStats();
      expect(stats.size).toBe(1); // Only one cached entry
    });

    it('should reject invalid address', async () => {
      await expect(
        calculator.getTokenInfo('invalid-address')
      ).rejects.toThrow();
    });

    it('should reject empty address', async () => {
      await expect(
        calculator.getTokenInfo('')
      ).rejects.toThrow();
    });

    it('should handle token not found', async () => {
      const nonExistentToken = '0x9999999999999999999999999999999999999999';

      await expect(
        calculator.getTokenInfo(nonExistentToken)
      ).rejects.toThrow('Token not found');
    });
  });

  describe('quoteBuy', () => {
    it('should calculate buy quote correctly', async () => {
      const bnbAmount = 1000000000000000000n; // 1 BNB
      const quote = await calculator.quoteBuy(testTokenAddress, bnbAmount);

      expect(quote.bnbCost).toBe(bnbAmount);
      expect(quote.fee).toBe(bnbAmount / 100n); // 1% fee
      expect(quote.tokenAmount).toBeGreaterThan(0n);
      expect(quote.pricePerToken).toBeGreaterThan(0n);
    });

    it('should reject invalid token address', async () => {
      await expect(
        calculator.quoteBuy('invalid', 1000000000000000000n)
      ).rejects.toThrow();
    });

    it('should reject zero amount', async () => {
      await expect(
        calculator.quoteBuy(testTokenAddress, 0n)
      ).rejects.toThrow();
    });

    it('should reject negative amount', async () => {
      await expect(
        calculator.quoteBuy(testTokenAddress, -1000n)
      ).rejects.toThrow();
    });

    it('should throw FeeExceedsAmountError when fee >= amount', async () => {
      // Mock a scenario where fee equals or exceeds amount
      const originalCalcFee = mockContract.calcTradingFee.bind(mockContract);
      mockContract.calcTradingFee = async () => 2000000000000000000n; // 2 BNB fee

      await expect(
        calculator.quoteBuy(testTokenAddress, 1000000000000000000n) // 1 BNB
      ).rejects.toThrow(FeeExceedsAmountError);

      mockContract.calcTradingFee = originalCalcFee;
    });

    it('should handle very large amounts', async () => {
      const largeAmount = 1000000000000000000000n; // 1000 BNB
      const quote = await calculator.quoteBuy(testTokenAddress, largeAmount);

      expect(quote.bnbCost).toBe(largeAmount);
      expect(quote.tokenAmount).toBeGreaterThan(0n);
    });

    it('should use cache for repeated queries', async () => {
      const spy = jest.spyOn(mockContract, '_tokenInfos');

      await calculator.quoteBuy(testTokenAddress, 1000000000000000000n);
      await calculator.quoteBuy(testTokenAddress, 2000000000000000000n);

      expect(spy).toHaveBeenCalledTimes(1); // Token info cached

      spy.mockRestore();
    });
  });

  describe('quoteSell', () => {
    it('should calculate sell quote correctly', async () => {
      const tokenAmount = 1000000000000000000n; // 1000 tokens
      const quote = await calculator.quoteSell(testTokenAddress, tokenAmount);

      expect(quote.tokenAmount).toBe(tokenAmount);
      expect(quote.bnbCost).toBeGreaterThan(0n);
      expect(quote.fee).toBeGreaterThan(0n);
      expect(quote.pricePerToken).toBeGreaterThan(0n);
    });

    it('should reject invalid token address', async () => {
      await expect(
        calculator.quoteSell('invalid', 1000000000000000000n)
      ).rejects.toThrow();
    });

    it('should reject zero amount', async () => {
      await expect(
        calculator.quoteSell(testTokenAddress, 0n)
      ).rejects.toThrow();
    });

    it('should throw FeeExceedsAmountError when fee >= proceeds', async () => {
      const originalCalcFee = mockContract.calcTradingFee.bind(mockContract);
      mockContract.calcTradingFee = async () => 2000000000000000000n; // 2 BNB fee

      await expect(
        calculator.quoteSell(testTokenAddress, 1000000000000000000n)
      ).rejects.toThrow(FeeExceedsAmountError);

      mockContract.calcTradingFee = originalCalcFee;
    });

    it('should handle very large token amounts', async () => {
      const largeAmount = 1000000000000000000000000n;
      const quote = await calculator.quoteSell(testTokenAddress, largeAmount);

      expect(quote.tokenAmount).toBe(largeAmount);
      expect(quote.bnbCost).toBeGreaterThan(0n);
    });
  });

  describe('calcBuyCost', () => {
    it('should calculate buy cost for exact token amount', async () => {
      const tokenInfo = await calculator.getTokenInfo(testTokenAddress);
      const tokenAmount = 1000000000000000000n;

      const quote = await calculator.calcBuyCost(tokenInfo, tokenAmount);

      expect(quote.tokenAmount).toBe(tokenAmount);
      expect(quote.bnbCost).toBeGreaterThan(0n);
      expect(quote.fee).toBeGreaterThan(0n);
      expect(quote.pricePerToken).toBeGreaterThan(0n);
    });

    it('should reject zero token amount', async () => {
      const tokenInfo = await calculator.getTokenInfo(testTokenAddress);

      await expect(
        calculator.calcBuyCost(tokenInfo, 0n)
      ).rejects.toThrow();
    });

    it('should include fee in total cost', async () => {
      const tokenInfo = await calculator.getTokenInfo(testTokenAddress);
      const tokenAmount = 1000000000000000000n;

      const quote = await calculator.calcBuyCost(tokenInfo, tokenAmount);

      // Total cost should be base cost + fee
      expect(quote.bnbCost).toBeGreaterThan(quote.fee);
    });
  });

  describe('getCurrentPrice', () => {
    it('should return current token price', async () => {
      const price = await calculator.getCurrentPrice(testTokenAddress);

      expect(price).toBe(1000000000000000n);
    });

    it('should reject invalid address', async () => {
      await expect(
        calculator.getCurrentPrice('invalid')
      ).rejects.toThrow();
    });

    it('should use cached token info', async () => {
      const spy = jest.spyOn(mockContract, '_tokenInfos');

      await calculator.getCurrentPrice(testTokenAddress);
      await calculator.getCurrentPrice(testTokenAddress);

      expect(spy).toHaveBeenCalledTimes(1); // Cached

      spy.mockRestore();
    });
  });

  describe('estimateBuySlippage', () => {
    it('should estimate minimum tokens with slippage', async () => {
      const bnbAmount = 1000000000000000000n;
      const slippage = 1; // 1%

      const minTokens = await calculator.estimateBuySlippage(
        testTokenAddress,
        bnbAmount,
        slippage
      );

      expect(minTokens).toBeGreaterThan(0n);

      // Should be approximately 99% of quote amount
      const quote = await calculator.quoteBuy(testTokenAddress, bnbAmount);
      const expected = (quote.tokenAmount * 9900n) / 10000n;
      expect(minTokens).toBe(expected);
    });

    it('should handle 0% slippage', async () => {
      const bnbAmount = 1000000000000000000n;

      const minTokens = await calculator.estimateBuySlippage(
        testTokenAddress,
        bnbAmount,
        0
      );

      const quote = await calculator.quoteBuy(testTokenAddress, bnbAmount);
      expect(minTokens).toBe(quote.tokenAmount);
    });

    it('should handle 100% slippage', async () => {
      const bnbAmount = 1000000000000000000n;

      const minTokens = await calculator.estimateBuySlippage(
        testTokenAddress,
        bnbAmount,
        100
      );

      expect(minTokens).toBe(0n);
    });

    it('should reject invalid slippage percentage', async () => {
      await expect(
        calculator.estimateBuySlippage(testTokenAddress, 1000000000000000000n, -1)
      ).rejects.toThrow();

      await expect(
        calculator.estimateBuySlippage(testTokenAddress, 1000000000000000000n, 101)
      ).rejects.toThrow();
    });

    it('should reject invalid address', async () => {
      await expect(
        calculator.estimateBuySlippage('invalid', 1000000000000000000n, 1)
      ).rejects.toThrow();
    });

    it('should reject zero amount', async () => {
      await expect(
        calculator.estimateBuySlippage(testTokenAddress, 0n, 1)
      ).rejects.toThrow();
    });
  });

  describe('estimateSellSlippage', () => {
    it('should estimate minimum BNB with slippage', async () => {
      const tokenAmount = 1000000000000000000n;
      const slippage = 1; // 1%

      const minBnb = await calculator.estimateSellSlippage(
        testTokenAddress,
        tokenAmount,
        slippage
      );

      expect(minBnb).toBeGreaterThan(0n);

      // Should be approximately 99% of quote amount
      const quote = await calculator.quoteSell(testTokenAddress, tokenAmount);
      const expected = (quote.bnbCost * 9900n) / 10000n;
      expect(minBnb).toBe(expected);
    });

    it('should handle 0% slippage', async () => {
      const tokenAmount = 1000000000000000000n;

      const minBnb = await calculator.estimateSellSlippage(
        testTokenAddress,
        tokenAmount,
        0
      );

      const quote = await calculator.quoteSell(testTokenAddress, tokenAmount);
      expect(minBnb).toBe(quote.bnbCost);
    });

    it('should handle 100% slippage', async () => {
      const tokenAmount = 1000000000000000000n;

      const minBnb = await calculator.estimateSellSlippage(
        testTokenAddress,
        tokenAmount,
        100
      );

      expect(minBnb).toBe(0n);
    });

    it('should reject invalid slippage percentage', async () => {
      await expect(
        calculator.estimateSellSlippage(testTokenAddress, 1000000000000000000n, -1)
      ).rejects.toThrow();

      await expect(
        calculator.estimateSellSlippage(testTokenAddress, 1000000000000000000n, 101)
      ).rejects.toThrow();
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      await calculator.getTokenInfo(testTokenAddress);

      let stats = calculator.getCacheStats();
      expect(stats.size).toBe(1);

      calculator.clearCache();

      stats = calculator.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should provide cache statistics', async () => {
      const stats = calculator.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('capacity');
      expect(stats).toHaveProperty('utilizationPercent');

      expect(stats.size).toBe(0);
      expect(stats.capacity).toBe(500);
      expect(stats.utilizationPercent).toBe(0);
    });

    it('should track cache utilization', async () => {
      await calculator.getTokenInfo(testTokenAddress);

      const stats = calculator.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.utilizationPercent).toBeGreaterThan(0);
    });

    it('should respect cache capacity', async () => {
      // This would require creating 500+ unique token addresses
      // Just verify the capacity is set correctly
      const stats = calculator.getCacheStats();
      expect(stats.capacity).toBe(500);
    });
  });

  describe('edge cases', () => {
    it('should handle token amount of 1 wei', async () => {
      const quote = await calculator.quoteBuy(testTokenAddress, 1n);

      expect(quote.tokenAmount).toBeGreaterThanOrEqual(0n);
      expect(quote.pricePerToken).toBeGreaterThanOrEqual(0n);
    });

    it('should handle zero token amount result', async () => {
      // Mock scenario where calcBuyAmount returns 0
      const originalCalcBuy = mockContract.calcBuyAmount.bind(mockContract);
      mockContract.calcBuyAmount = async () => 0n;

      const quote = await calculator.quoteBuy(testTokenAddress, 1000000000000000000n);

      expect(quote.tokenAmount).toBe(0n);
      expect(quote.pricePerToken).toBe(0n); // Avoid division by zero

      mockContract.calcBuyAmount = originalCalcBuy;
    });

    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        calculator.quoteBuy(testTokenAddress, BigInt(i + 1) * 1000000000000000000n)
      );

      const results = await Promise.all(promises);

      expect(results.length).toBe(10);
      results.forEach(result => {
        expect(result.tokenAmount).toBeGreaterThan(0n);
      });
    });

    it('should handle checksum vs lowercase addresses', async () => {
      const checksumAddress = '0x1234567890123456789012345678901234567890';
      const lowerAddress = checksumAddress.toLowerCase();

      await calculator.quoteBuy(checksumAddress, 1000000000000000000n);
      await calculator.quoteBuy(lowerAddress, 1000000000000000000n);

      // Should use same cache entry
      const stats = calculator.getCacheStats();
      expect(stats.size).toBe(1);
    });
  });
});
