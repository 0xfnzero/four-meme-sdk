import { ethers, Wallet, JsonRpcProvider, WebSocketProvider, EventLog, Log } from 'ethers';
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
import { PriceCalculator, PriceInfo } from './priceCalculator';

/**
 * FOUR Launch Platform Trading SDK for BSC
 * Contract: 0x5c952063c7fc8610FFDB798152D69F0B9550762b
 */

export interface FourTradingConfig {
  rpcUrl: string; // HTTP RPC endpoint for transactions
  wssUrl: string; // WebSocket endpoint for event subscriptions (required for real-time events)
  privateKey: string;
  contractAddress?: string;
}

export interface GasOptions {
  gasLimit?: bigint;
  gasPrice?: bigint;  // In wei, use ethers.parseUnits(amount, 'gwei') for gwei
  maxFeePerGas?: bigint;  // In wei, use ethers.parseUnits(amount, 'gwei') for gwei
  maxPriorityFeePerGas?: bigint;  // In wei, use ethers.parseUnits(amount, 'gwei') for gwei
}

export interface BuyParams {
  tokenAddress: string;
  fundsInBNB: bigint;  // In wei, use ethers.parseEther(amount) to convert from BNB
  minAmount?: bigint;  // In wei, use ethers.parseUnits(amount, 18) to convert
  to?: string; // Optional recipient address
  gas?: GasOptions;
}

export interface SellParams {
  tokenAddress: string;
  amount: bigint;  // In wei, use ethers.parseUnits(amount, 18) to convert
  minFunds?: bigint;  // In wei, use ethers.parseEther(amount) to convert from BNB
  origin?: number; // Origin identifier (default: 0)
  feeRate?: bigint; // Custom fee rate (optional)
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
  private provider: JsonRpcProvider; // HTTP provider for transactions
  private eventProvider: WebSocketProvider; // WebSocket provider for event subscriptions (required)
  private wallet: Wallet;
  private contract: ethers.Contract;
  private eventContract: ethers.Contract; // Contract instance for event subscriptions
  private contractAddress: string;
  private priceCalculator: PriceCalculator;

  // Event listeners storage with cleanup tracking
  private tokenCreateListeners: Map<string, { listener: TokenCreateListener; contractListener: any }> = new Map();
  private tokenPurchaseListeners: Map<string, { listener: TokenPurchaseListener; contractListener: any }> = new Map();
  private tokenSaleListeners: Map<string, { listener: TokenSaleListener; contractListener: any }> = new Map();
  private liquidityAddedListeners: Map<string, { listener: LiquidityAddedListener; contractListener: any }> = new Map();

  constructor(config: FourTradingConfig) {
    this.contractAddress = config.contractAddress || '0x5c952063c7fc8610FFDB798152D69F0B9550762b';

    // HTTP provider for transactions (required)
    this.provider = new JsonRpcProvider(config.rpcUrl);

    // WebSocket provider for events (required - cannot use polling)
    this.eventProvider = new WebSocketProvider(config.wssUrl);

    // Wallet connected to transaction provider
    this.wallet = new Wallet(config.privateKey, this.provider);

    // Contract for transactions (uses wallet with HTTP provider)
    this.contract = new ethers.Contract(
      this.contractAddress,
      FOUR_TRADING_ABI,
      this.wallet
    );

    // Contract for events (uses WebSocket provider for real-time subscriptions)
    this.eventContract = new ethers.Contract(
      this.contractAddress,
      FOUR_TRADING_ABI,
      this.eventProvider
    );

    // Initialize price calculator with read-only contract on transaction provider
    const readOnlyContract = new ethers.Contract(
      this.contractAddress,
      FOUR_TRADING_ABI,
      this.provider
    );
    this.priceCalculator = new PriceCalculator(readOnlyContract);
  }

  // ==================== Private Helpers ====================

  private buildTxOptions(gas?: GasOptions, value?: bigint): any {
    const options: any = {};

    if (value !== undefined) {
      options.value = value;
    }

    if (gas) {
      if (gas.gasLimit) {
        options.gasLimit = gas.gasLimit;
      }
      if (gas.gasPrice) {
        options.gasPrice = gas.gasPrice;
      }
      if (gas.maxFeePerGas) {
        options.maxFeePerGas = gas.maxFeePerGas;
      }
      if (gas.maxPriorityFeePerGas) {
        options.maxPriorityFeePerGas = gas.maxPriorityFeePerGas;
      }
    }

    return options;
  }

  // ==================== Trading Functions ====================

  /**
   * Buy tokens using BNB (AMAP - As Much As Possible)
   * This is the recommended method for buying tokens
   */
  async buyToken(params: BuyParams): Promise<TransactionResult> {
    try {
      const fundsWei = params.fundsInBNB;
      const minAmount = params.minAmount || 0n;

      console.log(`Buying token ${params.tokenAddress}`);
      console.log(`Spending: ${ethers.formatEther(params.fundsInBNB)} BNB`);
      console.log(`Min tokens: ${ethers.formatUnits(minAmount, 18)}`);

      const txOptions = this.buildTxOptions(params.gas, fundsWei);
      const recipient = params.to || this.wallet.address;

      // Correct method signature: buyTokenAMAP(token, to, funds, minAmount)
      const tx = await this.contract.buyTokenAMAP(
        params.tokenAddress,
        recipient,
        fundsWei,
        minAmount,
        txOptions
      );

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
    amount: bigint,
    maxFunds: bigint,
    to?: string,
    gas?: GasOptions
  ): Promise<TransactionResult> {
    try {
      const tokenAmount = amount;
      const maxFundsWei = maxFunds;

      console.log(`Buying exact ${ethers.formatUnits(amount, 18)} tokens`);
      console.log(`Max funds: ${ethers.formatEther(maxFunds)} BNB`);

      const txOptions = this.buildTxOptions(gas, maxFundsWei);
      const recipient = to || this.wallet.address;

      // Correct method signature: buyToken(token, to, amount, maxFunds)
      const tx = await this.contract.buyToken(
        tokenAddress,
        recipient,
        tokenAmount,
        maxFundsWei,
        txOptions
      );

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
   * IMPORTANT: Must approve token spending before calling this method
   */
  async sellToken(params: SellParams): Promise<TransactionResult> {
    try {
      const amount = params.amount;
      const minFunds = params.minFunds || 0n;

      console.log(`Selling token ${params.tokenAddress}`);
      console.log(`Amount: ${ethers.formatUnits(params.amount, 18)}`);
      console.log(`Min funds: ${ethers.formatEther(minFunds)} BNB`);

      const txOptions = this.buildTxOptions(params.gas);

      // Use explicit function signature to avoid ambiguity with overloaded functions
      // sellToken(address token, uint256 amount, uint256 minFunds)
      const tx = await this.contract['sellToken(address,uint256,uint256)'](
        params.tokenAddress,
        amount,
        minFunds,
        txOptions
      );

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
    amount?: bigint,
    gas?: GasOptions
  ): Promise<TransactionResult> {
    try {
      const tokenABI = ['function approve(address spender, uint256 amount) returns (bool)'];
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, this.wallet);

      const approveAmount = amount || ethers.MaxUint256;

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
    return await this.priceCalculator.getTokenInfo(tokenAddress);
  }

  /**
   * Quote buy - calculate how many tokens you get for given BNB amount
   * @param bnbAmount - Amount in wei, use ethers.parseEther(amount) to convert from BNB
   */
  async quoteBuy(tokenAddress: string, bnbAmount: bigint): Promise<PriceInfo> {
    return await this.priceCalculator.quoteBuy(tokenAddress, bnbAmount);
  }

  /**
   * Quote sell - calculate how much BNB you get for given token amount
   * @param tokenAmount - Amount in wei, use ethers.parseUnits(amount, 18) to convert
   */
  async quoteSell(tokenAddress: string, tokenAmount: bigint): Promise<PriceInfo> {
    return await this.priceCalculator.quoteSell(tokenAddress, tokenAmount);
  }

  /**
   * Get current price of token
   */
  async getCurrentPrice(tokenAddress: string): Promise<string> {
    const price = await this.priceCalculator.getCurrentPrice(tokenAddress);
    return ethers.formatEther(price);
  }

  /**
   * Calculate buy amount with slippage protection
   * @param bnbAmount - Amount in wei, use ethers.parseEther(amount) to convert from BNB
   */
  async calculateBuyWithSlippage(
    tokenAddress: string,
    bnbAmount: bigint,
    slippagePercent: number = 1
  ): Promise<{ minTokenAmount: string; estimatedTokenAmount: string; pricePerToken: string }> {
    const priceInfo = await this.priceCalculator.quoteBuy(tokenAddress, bnbAmount);
    const minAmount = await this.priceCalculator.estimateBuySlippage(tokenAddress, bnbAmount, slippagePercent);

    return {
      minTokenAmount: ethers.formatUnits(minAmount, 18),
      estimatedTokenAmount: ethers.formatUnits(priceInfo.tokenAmount, 18),
      pricePerToken: ethers.formatEther(priceInfo.pricePerToken),
    };
  }

  /**
   * Calculate sell with slippage protection
   * @param tokenAmount - Amount in wei, use ethers.parseUnits(amount, 18) to convert
   */
  async calculateSellWithSlippage(
    tokenAddress: string,
    tokenAmount: bigint,
    slippagePercent: number = 1
  ): Promise<{ minBnbAmount: string; estimatedBnbAmount: string; pricePerToken: string }> {
    const priceInfo = await this.priceCalculator.quoteSell(tokenAddress, tokenAmount);
    const minFunds = await this.priceCalculator.estimateSellSlippage(tokenAddress, tokenAmount, slippagePercent);

    return {
      minBnbAmount: ethers.formatEther(minFunds),
      estimatedBnbAmount: ethers.formatEther(priceInfo.bnbCost),
      pricePerToken: ethers.formatEther(priceInfo.pricePerToken),
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

    const contractListener = (creator: string, token: string, requestId: bigint, name: string, symbol: string, totalSupply: bigint, launchTime: bigint, launchFee: bigint) => {
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
    };

    this.tokenCreateListeners.set(id, { listener, contractListener });
    this.eventContract.on('TokenCreate', contractListener);

    return id;
  }

  /**
   * Subscribe to TokenPurchase events
   */
  onTokenPurchase(listener: TokenPurchaseListener, tokenAddress?: string): string {
    const id = `tokenPurchase_${Date.now()}_${Math.random()}`;

    const contractListener = (token: string, account: string, price: bigint, amount: bigint, cost: bigint, fee: bigint, offers: bigint, funds: bigint) => {
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
    };

    this.tokenPurchaseListeners.set(id, { listener, contractListener });
    this.eventContract.on('TokenPurchase', contractListener);

    return id;
  }

  /**
   * Subscribe to TokenSale events
   */
  onTokenSale(listener: TokenSaleListener, tokenAddress?: string): string {
    const id = `tokenSale_${Date.now()}_${Math.random()}`;

    const contractListener = (token: string, account: string, price: bigint, amount: bigint, cost: bigint, fee: bigint, offers: bigint, funds: bigint) => {
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
    };

    this.tokenSaleListeners.set(id, { listener, contractListener });
    this.eventContract.on('TokenSale', contractListener);

    return id;
  }

  /**
   * Subscribe to LiquidityAdded events
   */
  onLiquidityAdded(listener: LiquidityAddedListener): string {
    const id = `liquidityAdded_${Date.now()}_${Math.random()}`;

    const contractListener = (base: string, offers: bigint, quote: string, funds: bigint) => {
      const event: LiquidityAddedEvent = {
        base,
        offers,
        quote,
        funds,
      };
      listener(event);
    };

    this.liquidityAddedListeners.set(id, { listener, contractListener });
    this.eventContract.on('LiquidityAdded', contractListener);

    return id;
  }

  /**
   * Unsubscribe from an event
   */
  off(listenerId: string): void {
    // Check TokenCreate listeners
    if (this.tokenCreateListeners.has(listenerId)) {
      const { contractListener } = this.tokenCreateListeners.get(listenerId)!;
      this.eventContract.off('TokenCreate', contractListener);
      this.tokenCreateListeners.delete(listenerId);
      return;
    }

    // Check TokenPurchase listeners
    if (this.tokenPurchaseListeners.has(listenerId)) {
      const { contractListener } = this.tokenPurchaseListeners.get(listenerId)!;
      this.eventContract.off('TokenPurchase', contractListener);
      this.tokenPurchaseListeners.delete(listenerId);
      return;
    }

    // Check TokenSale listeners
    if (this.tokenSaleListeners.has(listenerId)) {
      const { contractListener } = this.tokenSaleListeners.get(listenerId)!;
      this.eventContract.off('TokenSale', contractListener);
      this.tokenSaleListeners.delete(listenerId);
      return;
    }

    // Check LiquidityAdded listeners
    if (this.liquidityAddedListeners.has(listenerId)) {
      const { contractListener } = this.liquidityAddedListeners.get(listenerId)!;
      this.eventContract.off('LiquidityAdded', contractListener);
      this.liquidityAddedListeners.delete(listenerId);
      return;
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.eventContract.removeAllListeners();
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
