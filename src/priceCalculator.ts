import { ethers } from 'ethers';
import { TokenInfo } from './types';

const ONE_ETHER = 1000000000000000000n;

export interface PriceInfo {
  tokenAmount: bigint;
  bnbCost: bigint;
  pricePerToken: bigint;
  fee: bigint;
}

export class PriceCalculator {
  private contract: ethers.Contract;

  constructor(contract: ethers.Contract) {
    this.contract = contract;
  }

  async getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
    const info = await this.contract._tokenInfos(tokenAddress);
    return {
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
  }

  async quoteBuy(tokenAddress: string, bnbAmount: bigint): Promise<PriceInfo> {
    const tokenInfo = await this.getTokenInfo(tokenAddress);
    const fee: bigint = await this.contract.calcTradingFee(tokenInfo, bnbAmount);
    const fundsAfterFee: bigint = bnbAmount - fee;
    const tokenAmount: bigint = await this.contract.calcBuyAmount(tokenInfo, fundsAfterFee);
    const pricePerToken: bigint = tokenAmount > 0n ? (bnbAmount * ONE_ETHER) / tokenAmount : 0n;
    return { tokenAmount, bnbCost: bnbAmount, pricePerToken, fee };
  }

  async quoteSell(tokenAddress: string, tokenAmount: bigint): Promise<PriceInfo> {
    const tokenInfo = await this.getTokenInfo(tokenAddress);
    const bnbBeforeFee: bigint = await this.contract.calcSellCost(tokenInfo, tokenAmount);
    const fee: bigint = await this.contract.calcTradingFee(tokenInfo, bnbBeforeFee);
    const bnbCost: bigint = bnbBeforeFee - fee;
    const pricePerToken: bigint = tokenAmount > 0n ? (bnbCost * ONE_ETHER) / tokenAmount : 0n;
    return { tokenAmount, bnbCost, pricePerToken, fee };
  }

  async calcBuyCost(tokenInfo: TokenInfo, tokenAmount: bigint): Promise<PriceInfo> {
    const bnbBeforeFee: bigint = await this.contract.calcBuyCost(tokenInfo, tokenAmount);
    const fee: bigint = await this.contract.calcTradingFee(tokenInfo, bnbBeforeFee);
    const bnbCost: bigint = bnbBeforeFee + fee;
    const pricePerToken: bigint = tokenAmount > 0n ? (bnbCost * ONE_ETHER) / tokenAmount : 0n;
    return { tokenAmount, bnbCost, pricePerToken, fee };
  }

  async getCurrentPrice(tokenAddress: string): Promise<bigint> {
    const tokenInfo = await this.getTokenInfo(tokenAddress);
    return await this.contract.calcLastPrice(tokenInfo);
  }

  async estimateBuySlippage(tokenAddress: string, bnbAmount: bigint, slippagePercent: number): Promise<bigint> {
    const priceInfo = await this.quoteBuy(tokenAddress, bnbAmount);
    const slippageFactor = BigInt(Math.floor((100 - slippagePercent) * 100));
    return (priceInfo.tokenAmount * slippageFactor) / 10000n;
  }

  async estimateSellSlippage(tokenAddress: string, tokenAmount: bigint, slippagePercent: number): Promise<bigint> {
    const priceInfo = await this.quoteSell(tokenAddress, tokenAmount);
    const slippageFactor = BigInt(Math.floor((100 - slippagePercent) * 100));
    return (priceInfo.bnbCost * slippageFactor) / 10000n;
  }
}
