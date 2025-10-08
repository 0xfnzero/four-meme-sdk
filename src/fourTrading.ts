import { ethers, Wallet, JsonRpcProvider, EventLog, Log } from 'ethers';
import { FOUR_TRADING_ABI } from './abi';
import {
  TokenInfo,
  TokenInfoEx,
  Template,
  TransactionResult,
  TokenCreateEvent,
  TokenPurchaseEvent,
  TokenSaleEvent,
  LiquidityAddedEvent,
} from './types';

/**
 * FOUR Launch Platform Trading SDK for BSC
 * Contract: 0x5c952063c7fc8610FFDB798152D69F0B9550762b
 */

export interface FourTradingConfig {
  rpcUrl: string;
  privateKey: string;
  contractAddress?: string;
}

export interface GasOptions {
  gasLimit?: number | string;
  gasPrice?: number | string;
  maxFeePerGas?: number | string;
  maxPriorityFeePerGas?: number | string;
}

export interface BuyParams {
  tokenAddress: string;
  fundsInBNB: number | string;
  minAmount?: number | string;
  to?: string; // Optional recipient address
  gas?: GasOptions;
}

export interface SellParams {
  tokenAddress: string;
  amount: number | string;
  minFunds?: number | string;
  origin?: number; // Origin identifier (default: 0)
  feeRate?: number | string; // Custom fee rate (optional)
  feeRecipient?: string; // Custom fee recipient (optional)
  gas?: GasOptions;
}

export interface CreateTokenParams {
  args: string; // Encoded arguments
  signature?: string; // Optional signature for verification
  gas?: GasOptions;
}

// Event listener types
export type TokenCreateListener = (event: TokenCreateEvent) => void;
export type TokenPurchaseListener = (event: TokenPurchaseEvent) => void;
export type TokenSaleListener = (event: TokenSaleEvent) => void;
export type LiquidityAddedListener = (event: LiquidityAddedEvent) => void;

export class FourTrading {
  private provider: JsonRpcProvider;
  private wallet: Wallet;
  private contract: ethers.Contract;
  private contractAddress: string;

  // Event listeners storage
  private tokenCreateListeners: Map<string, TokenCreateListener> = new Map();
  private tokenPurchaseListeners: Map<string, TokenPurchaseListener> = new Map();
  private tokenSaleListeners: Map<string, TokenSaleListener> = new Map();
  private liquidityAddedListeners: Map<string, LiquidityAddedListener> = new Map();

  constructor(config: FourTradingConfig) {
    this.contractAddress = config.contractAddress || '0x5c952063c7fc8610FFDB798152D69F0B9550762b';
    this.provider = new JsonRpcProvider(config.rpcUrl);
    this.wallet = new Wallet(config.privateKey, this.provider);
    this.contract = new ethers.Contract(
      this.contractAddress,
      FOUR_TRADING_ABI,
      this.wallet
    );
  }

  // ==================== Private Helpers ====================

  private buildTxOptions(gas?: GasOptions, value?: bigint): any {
    const options: any = {};

    if (value !== undefined) {
      options.value = value;
    }

    if (gas) {
      if (gas.gasLimit) {
        options.gasLimit = BigInt(gas.gasLimit);
      }

      if (gas.gasPrice) {
        options.gasPrice = ethers.parseUnits(gas.gasPrice.toString(), 'gwei');
      }

      if (gas.maxFeePerGas) {
        options.maxFeePerGas = ethers.parseUnits(gas.maxFeePerGas.toString(), 'gwei');
      }
      if (gas.maxPriorityFeePerGas) {
        options.maxPriorityFeePerGas = ethers.parseUnits(
          gas.maxPriorityFeePerGas.toString(),
          'gwei'
        );
      }
    }

    return options;
  }

  // ==================== Trading Functions ====================

  /**
   * Buy tokens using BNB (AMAP - As Much As Possible)
   */
  async buyToken(params: BuyParams): Promise<TransactionResult> {
    try {
      const fundsWei = ethers.parseEther(params.fundsInBNB.toString());
      const minAmount = params.minAmount
        ? ethers.parseUnits(params.minAmount.toString(), 18)
        : 0n;

      console.log(`Buying token ${params.tokenAddress}`);
      console.log(`Spending: ${params.fundsInBNB} BNB`);
      console.log(`Min tokens: ${params.minAmount || 0}`);

      const txOptions = this.buildTxOptions(params.gas, fundsWei);

      let tx;
      if (params.to) {
        // Buy to specific address
        tx = await this.contract.buyTokenAMAP(
          params.tokenAddress,
          params.to,
          fundsWei,
          minAmount,
          txOptions
        );
      } else {
        // Buy to self
        tx = await this.contract.buyTokenAMAP(
          params.tokenAddress,
          fundsWei,
          minAmount,
          txOptions
        );
      }

      console.log(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      return {
        success: true,
        txHash: tx.hash,
        receipt,
      };
    } catch (error: any) {
      console.error('Buy transaction failed:', error.message);
      throw error;
    }
  }

  /**
   * Buy exact amount of tokens with maximum funds limit
   */
  async buyTokenExact(
    tokenAddress: string,
    amount: number | string,
    maxFunds: number | string,
    to?: string,
    gas?: GasOptions
  ): Promise<TransactionResult> {
    try {
      const tokenAmount = ethers.parseUnits(amount.toString(), 18);
      const maxFundsWei = ethers.parseEther(maxFunds.toString());

      console.log(`Buying exact ${amount} tokens`);
      console.log(`Max funds: ${maxFunds} BNB`);

      const txOptions = this.buildTxOptions(gas, maxFundsWei);

      let tx;
      if (to) {
        tx = await this.contract.buyToken(tokenAddress, to, tokenAmount, maxFundsWei, txOptions);
      } else {
        tx = await this.contract.buyToken(tokenAddress, tokenAmount, maxFundsWei, txOptions);
      }

      console.log(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      return {
        success: true,
        txHash: tx.hash,
        receipt,
      };
    } catch (error: any) {
      console.error('Buy exact transaction failed:', error.message);
      throw error;
    }
  }

  /**
   * Sell tokens for BNB
   */
  async sellToken(params: SellParams): Promise<TransactionResult> {
    try {
      const amount = ethers.parseUnits(params.amount.toString(), 18);
      const minFunds = params.minFunds
        ? ethers.parseEther(params.minFunds.toString())
        : 0n;
      const origin = params.origin || 0;

      console.log(`Selling token ${params.tokenAddress}`);
      console.log(`Amount: ${params.amount}`);
      console.log(`Min funds: ${params.minFunds || 0} BNB`);

      const txOptions = this.buildTxOptions(params.gas);

      let tx;
      if (params.feeRate && params.feeRecipient) {
        // Custom fee configuration
        const feeRate = BigInt(params.feeRate);
        tx = await this.contract.sellToken(
          origin,
          params.tokenAddress,
          amount,
          minFunds,
          feeRate,
          params.feeRecipient,
          txOptions
        );
      } else if (minFunds > 0n) {
        // With minimum funds protection
        tx = await this.contract.sellToken(
          origin,
          params.tokenAddress,
          amount,
          minFunds,
          txOptions
        );
      } else {
        // Simple sell
        tx = await this.contract.sellToken(params.tokenAddress, amount, txOptions);
      }

      console.log(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      return {
        success: true,
        txHash: tx.hash,
        receipt,
      };
    } catch (error: any) {
      console.error('Sell transaction failed:', error.message);
      throw error;
    }
  }

  /**
   * Create a new token on the platform
   */
  async createToken(params: CreateTokenParams): Promise<TransactionResult> {
    try {
      console.log('Creating new token...');

      const txOptions = this.buildTxOptions(params.gas);

      let tx;
      if (params.signature) {
        tx = await this.contract.createToken(params.args, params.signature, txOptions);
      } else {
        tx = await this.contract.createToken(params.args, txOptions);
      }

      console.log(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      return {
        success: true,
        txHash: tx.hash,
        receipt,
      };
    } catch (error: any) {
      console.error('Create token failed:', error.message);
      throw error;
    }
  }

  /**
   * Add liquidity to a token (admin function)
   */
  async addLiquidity(tokenAddress: string, gas?: GasOptions): Promise<TransactionResult> {
    try {
      console.log(`Adding liquidity for token ${tokenAddress}`);

      const txOptions = this.buildTxOptions(gas);
      const tx = await this.contract.addLiquidity(tokenAddress, txOptions);

      console.log(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      return {
        success: true,
        txHash: tx.hash,
        receipt,
      };
    } catch (error: any) {
      console.error('Add liquidity failed:', error.message);
      throw error;
    }
  }

  // ==================== Token Approval ====================

  /**
   * Approve token spending before selling
   */
  async approveToken(
    tokenAddress: string,
    amount?: number | string,
    gas?: GasOptions
  ): Promise<TransactionResult> {
    try {
      const tokenABI = ['function approve(address spender, uint256 amount) returns (bool)'];
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, this.wallet);

      const approveAmount = amount
        ? ethers.parseUnits(amount.toString(), 18)
        : ethers.MaxUint256;

      console.log(`Approving ${this.contractAddress} to spend tokens`);

      const txOptions = this.buildTxOptions(gas);
      const tx = await tokenContract.approve(this.contractAddress, approveAmount, txOptions);

      console.log(`Approval transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Approval confirmed in block ${receipt.blockNumber}`);

      return {
        success: true,
        txHash: tx.hash,
        receipt,
      };
    } catch (error: any) {
      console.error('Approval failed:', error.message);
      throw error;
    }
  }

  // ==================== Query Functions ====================

  /**
   * Get token information
   */
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

  /**
   * Get extended token information
   */
  async getTokenInfoEx(tokenAddress: string): Promise<TokenInfoEx> {
    const info = await this.contract._tokenInfoExs(tokenAddress);
    return {
      creator: info.creator,
      founder: info.founder,
      reserves: info.reserves,
    };
  }

  /**
   * Get template information
   */
  async getTemplate(templateId: number): Promise<Template> {
    const template = await this.contract._templates(templateId);
    return {
      quote: template.quote,
      initialLiquidity: template.initialLiquidity,
      maxRaising: template.maxRaising,
      totalSupply: template.totalSupply,
      maxOffers: template.maxOffers,
      minTradingFee: template.minTradingFee,
    };
  }

  /**
   * Get token address by index
   */
  async getTokenByIndex(index: number): Promise<string> {
    return await this.contract._tokens(index);
  }

  /**
   * Get total token count
   */
  async getTokenCount(): Promise<bigint> {
    return await this.contract._tokenCount();
  }

  /**
   * Get template count
   */
  async getTemplateCount(): Promise<bigint> {
    return await this.contract._templateCount();
  }

  /**
   * Get current trading fee rate
   */
  async getTradingFeeRate(): Promise<bigint> {
    return await this.contract._tradingFeeRate();
  }

  /**
   * Get launch fee
   */
  async getLaunchFee(): Promise<bigint> {
    return await this.contract._launchFee();
  }

  /**
   * Get fee recipient address
   */
  async getFeeRecipient(): Promise<string> {
    return await this.contract._feeRecipient();
  }

  /**
   * Get referral reward rate
   */
  async getReferralRewardRate(): Promise<bigint> {
    return await this.contract._referralRewardRate();
  }

  /**
   * Check if trading is halted
   */
  async isTradingHalted(): Promise<boolean> {
    return await this.contract._tradingHalt();
  }

  /**
   * Get contract owner
   */
  async getOwner(): Promise<string> {
    return await this.contract.owner();
  }

  /**
   * Get signer address
   */
  async getSigner(): Promise<string> {
    return await this.contract.signer();
  }

  /**
   * Get status constants
   */
  async getStatusConstants(): Promise<{
    TRADING: bigint;
    ADDING_LIQUIDITY: bigint;
    COMPLETED: bigint;
    HALT: bigint;
  }> {
    const [TRADING, ADDING_LIQUIDITY, COMPLETED, HALT] = await Promise.all([
      this.contract.STATUS_TRADING(),
      this.contract.STATUS_ADDING_LIQUIDITY(),
      this.contract.STATUS_COMPLETED(),
      this.contract.STATUS_HALT(),
    ]);
    return { TRADING, ADDING_LIQUIDITY, COMPLETED, HALT };
  }

  /**
   * Calculate buy amount for given funds
   */
  async calcBuyAmount(tokenInfo: TokenInfo, funds: bigint): Promise<bigint> {
    return await this.contract.calcBuyAmount(tokenInfo, funds);
  }

  /**
   * Calculate buy cost for given amount
   */
  async calcBuyCost(tokenInfo: TokenInfo, amount: bigint): Promise<bigint> {
    return await this.contract.calcBuyCost(tokenInfo, amount);
  }

  /**
   * Calculate sell cost for given amount
   */
  async calcSellCost(tokenInfo: TokenInfo, amount: bigint): Promise<bigint> {
    return await this.contract.calcSellCost(tokenInfo, amount);
  }

  /**
   * Calculate trading fee
   */
  async calcTradingFee(tokenInfo: TokenInfo, funds: bigint): Promise<bigint> {
    return await this.contract.calcTradingFee(tokenInfo, funds);
  }

  /**
   * Calculate last price
   */
  async calcLastPrice(tokenInfo: TokenInfo): Promise<bigint> {
    return await this.contract.calcLastPrice(tokenInfo);
  }

  /**
   * Get BNB balance of wallet
   */
  async getBNBBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  /**
   * Get token balance of wallet
   */
  async getTokenBalance(tokenAddress: string): Promise<string> {
    const tokenABI = ['function balanceOf(address owner) view returns (uint256)'];
    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, this.provider);
    const balance = await tokenContract.balanceOf(this.wallet.address);
    return ethers.formatUnits(balance, 18);
  }

  /**
   * Get wallet address
   */
  getWalletAddress(): string {
    return this.wallet.address;
  }

  // ==================== Event Subscription ====================

  /**
   * Subscribe to TokenCreate events
   */
  onTokenCreate(listener: TokenCreateListener): string {
    const id = `tokenCreate_${Date.now()}_${Math.random()}`;
    this.tokenCreateListeners.set(id, listener);

    this.contract.on('TokenCreate', (creator, token, requestId, name, symbol, totalSupply, launchTime, launchFee) => {
      const event: TokenCreateEvent = {
        creator,
        token,
        requestId,
        name,
        symbol,
        totalSupply,
        launchTime,
        launchFee,
      };
      listener(event);
    });

    return id;
  }

  /**
   * Subscribe to TokenPurchase events
   */
  onTokenPurchase(listener: TokenPurchaseListener, tokenAddress?: string): string {
    const id = `tokenPurchase_${Date.now()}_${Math.random()}`;
    this.tokenPurchaseListeners.set(id, listener);

    this.contract.on('TokenPurchase', (token, account, price, amount, cost, fee, offers, funds) => {
      if (tokenAddress && token.toLowerCase() !== tokenAddress.toLowerCase()) {
        return; // Filter by token address if provided
      }

      const event: TokenPurchaseEvent = {
        token,
        account,
        price,
        amount,
        cost,
        fee,
        offers,
        funds,
      };
      listener(event);
    });

    return id;
  }

  /**
   * Subscribe to TokenSale events
   */
  onTokenSale(listener: TokenSaleListener, tokenAddress?: string): string {
    const id = `tokenSale_${Date.now()}_${Math.random()}`;
    this.tokenSaleListeners.set(id, listener);

    this.contract.on('TokenSale', (token, account, price, amount, cost, fee, offers, funds) => {
      if (tokenAddress && token.toLowerCase() !== tokenAddress.toLowerCase()) {
        return;
      }

      const event: TokenSaleEvent = {
        token,
        account,
        price,
        amount,
        cost,
        fee,
        offers,
        funds,
      };
      listener(event);
    });

    return id;
  }

  /**
   * Subscribe to LiquidityAdded events
   */
  onLiquidityAdded(listener: LiquidityAddedListener): string {
    const id = `liquidityAdded_${Date.now()}_${Math.random()}`;
    this.liquidityAddedListeners.set(id, listener);

    this.contract.on('LiquidityAdded', (base, offers, quote, funds) => {
      const event: LiquidityAddedEvent = {
        base,
        offers,
        quote,
        funds,
      };
      listener(event);
    });

    return id;
  }

  /**
   * Unsubscribe from an event
   */
  off(listenerId: string): void {
    if (this.tokenCreateListeners.has(listenerId)) {
      this.tokenCreateListeners.delete(listenerId);
    } else if (this.tokenPurchaseListeners.has(listenerId)) {
      this.tokenPurchaseListeners.delete(listenerId);
    } else if (this.tokenSaleListeners.has(listenerId)) {
      this.tokenSaleListeners.delete(listenerId);
    } else if (this.liquidityAddedListeners.has(listenerId)) {
      this.liquidityAddedListeners.delete(listenerId);
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.contract.removeAllListeners();
    this.tokenCreateListeners.clear();
    this.tokenPurchaseListeners.clear();
    this.tokenSaleListeners.clear();
    this.liquidityAddedListeners.clear();
  }

  /**
   * Query historical events
   */
  async getTokenCreateEvents(fromBlock: number = 0, toBlock: number | string = 'latest'): Promise<TokenCreateEvent[]> {
    const filter = this.contract.filters.TokenCreate();
    const events = await this.contract.queryFilter(filter, fromBlock, toBlock);

    return events.map((event: any) => ({
      creator: event.args.creator,
      token: event.args.token,
      requestId: event.args.requestId,
      name: event.args.name,
      symbol: event.args.symbol,
      totalSupply: event.args.totalSupply,
      launchTime: event.args.launchTime,
      launchFee: event.args.launchFee,
    }));
  }

  /**
   * Query historical TokenPurchase events
   */
  async getTokenPurchaseEvents(tokenAddress?: string, fromBlock: number = 0, toBlock: number | string = 'latest'): Promise<TokenPurchaseEvent[]> {
    const filter = this.contract.filters.TokenPurchase();
    const events = await this.contract.queryFilter(filter, fromBlock, toBlock);

    return events
      .filter((event: any) => !tokenAddress || event.args.token.toLowerCase() === tokenAddress.toLowerCase())
      .map((event: any) => ({
        token: event.args.token,
        account: event.args.account,
        price: event.args.price,
        amount: event.args.amount,
        cost: event.args.cost,
        fee: event.args.fee,
        offers: event.args.offers,
        funds: event.args.funds,
      }));
  }

  /**
   * Query historical TokenSale events
   */
  async getTokenSaleEvents(tokenAddress?: string, fromBlock: number = 0, toBlock: number | string = 'latest'): Promise<TokenSaleEvent[]> {
    const filter = this.contract.filters.TokenSale();
    const events = await this.contract.queryFilter(filter, fromBlock, toBlock);

    return events
      .filter((event: any) => !tokenAddress || event.args.token.toLowerCase() === tokenAddress.toLowerCase())
      .map((event: any) => ({
        token: event.args.token,
        account: event.args.account,
        price: event.args.price,
        amount: event.args.amount,
        cost: event.args.cost,
        fee: event.args.fee,
        offers: event.args.offers,
        funds: event.args.funds,
      }));
  }
}
